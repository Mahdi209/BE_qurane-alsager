const bcrypt = require('bcryptjs');
const Admin = require('../models/admins');
const { signupSchema, loginSchema } = require('../Validation/admin.validation');
const { generateTokens, verifyRefreshToken } = require('../Utilities/tokens');
const { sendResponse,handleOperationLog } = require('../Utilities/response');
const { sendEmail } = require("../Utilities/email");

const signup = async (req, res) => {
    try {
        const requestingAdmin = req.admin;
        const profile = req.file;

        // Validate request body
        const { error } = signupSchema.validate(req.body);
        if (error) {
            return sendResponse(res, null, error.details[0].message, 400);
        }

        const { username, email, role = 'user', fullName, permissions } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [{ email }, { username }]
        });
        if (existingAdmin) {
            if (existingAdmin.email === email) {
                return sendResponse(res, null, 'Email already registered', 400);
            }
            if (existingAdmin.username === username) {
                return sendResponse(res, null, 'Username already exists', 400);
            }
        }

        // Generate default password
        const password = "quran12345";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Default permissions structure
        const defaultPermissions = {
            category: {
                create: false,
                read: true,
                update: false,
                delete: false
            },
            ageGroup: {
                create: false,
                read: true,
                update: false,
                delete: false
            },
            question: {
                create: false,
                read: true,
                update: false,
                delete: false
            }
        };

        // Handle permissions from request
        let finalPermissions = defaultPermissions;

        if (permissions) {
            try {
                // If permissions is a string, parse it
                const parsedPermissions = typeof permissions === 'string'
                    ? JSON.parse(permissions)
                    : permissions;

                // Merge with default permissions
                finalPermissions = {
                    category: {
                        ...defaultPermissions.category,
                        ...(parsedPermissions.category || {})
                    },
                    ageGroup: {
                        ...defaultPermissions.ageGroup,
                        ...(parsedPermissions.ageGroup || {})
                    },
                    question: {
                        ...defaultPermissions.question,
                        ...(parsedPermissions.question || {})
                    }
                };
            } catch (parseError) {
                console.error('Permissions parsing error:', parseError);
                return sendResponse(res, null, 'Invalid permissions format', 400);
            }
        }

        // Create admin object
        const adminData = {
            username: username.trim(),
            fullName: fullName.trim(),
            email: email.trim(),
            password: hashedPassword,
            role,
            permissions: finalPermissions,
            status: 'active' // Set default status
        };

        // Add profile image if provided
        if (profile) {
            adminData.profile = `/admins_image/${profile.filename}`;
        }

        const admin = new Admin(adminData);
        await admin.save();

        // Prepare response data (exclude password)
        const responseAdminData = {
            id: admin._id,
            username: admin.username,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            status: admin.status,
            profile: admin.profile || null,
            createdAt: admin.createdAt
        };

        // Log the operation
        await handleOperationLog(
            requestingAdmin.id,
            'Create',
            "admin",
            admin._id,
            `تم انشاء حساب مستخدم باسم ${admin.username}`
        );

        return sendResponse(res, 'User created successfully',null, 201);

    } catch (error) {
        console.error('Signup error:', error);

        // Handle specific mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return sendResponse(res, null, validationErrors.join(', '), 400);
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return sendResponse(res, null, `${field} already exists`, 400);
        }

        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return sendResponse(res, null, error.details[0].message, 400);
        }

        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        // Check if admin exists FIRST
        if (!admin) {
            return sendResponse(res, null, 'Invalid username or password', 401);
        }

        // THEN check if admin is inactive
        if (admin.status === 'inactive') {
            return sendResponse(res, null, 'Access denied. this user is inactive.', 500);
        }

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return sendResponse(res, null, 'Invalid username or password', 401);
        }

        const { accessToken, refreshToken } = generateTokens(admin);

        admin.refreshToken = refreshToken;
        await admin.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const adminData = {
            id: admin._id,
            username: admin.username,
            fullName: admin.fullName ? admin.fullName : '',
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        };

        await handleOperationLog(adminData.id, 'Get',"admin", admin._id, `تم دخول لحساب ادمن باسم ${admin.username}`);

        return sendResponse(res, { admin: adminData, accessToken }, null, 200);
    } catch (error) {
        console.error('Login error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return sendResponse(res, null, 'No refresh token provided', 400);
        }

        const { valid, data } = verifyRefreshToken(refreshToken);
        if (!valid) {
            return sendResponse(res, null, 'Invalid refresh token', 401);
        }
        const admin = await Admin.findById(data.id);
        if (admin) {
            admin.tokenVersion += 1;
            admin.refreshToken = null;
            await admin.save();
        }

        // الطريقة الصحيحة لمسح الكوكي
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
        });

        await handleOperationLog(admin._id, 'Get', "admin", admin._id, `تم الخروج من  حساب ادمن باسم ${admin.username}`);

        return sendResponse(res, "Logout Successful", null, 200);
    } catch (error) {
        console.error('Logout error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return sendResponse(res, null, 'No refresh token provided', 400);
        }

        const { valid, data } = verifyRefreshToken(refreshToken);
        if (!valid) {
            return sendResponse(res, null, 'Invalid refresh token', 401);
        }

        const admin = await Admin.findById(data.id).populate('role');

        // Check if admin exists first
        if (!admin) {
            console.log('Admin not found for ID:', data.id);
            return sendResponse(res, null, 'Invalid refresh token', 401);
        }

        if (admin.tokenVersion !== data.tokenVersion) {
            console.log('Token version mismatch:', {
                adminVersion: admin.tokenVersion,
                tokenVersion: data.tokenVersion
            });
            return sendResponse(res, null, 'Invalid refresh token', 401);
        }

        const tokens = generateTokens(admin);
        admin.refreshToken = tokens.refreshToken;
        await admin.save();

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return sendResponse(res, { accessToken: tokens.accessToken }, null, 200);
    } catch (error) {
        console.error('Token refresh error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const requestingAdmin = req.admin;

        if (id === requestingAdmin.id) {
            return sendResponse(res, null, 'Cannot delete your own account', 400);
        }

        const adminToDelete = await Admin.findById(id);
        if (!adminToDelete) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        await Admin.findByIdAndDelete(id);
        await handleOperationLog(requestingAdmin.id, 'Delete', "admin", id, `تم حذف حساب ادمن باسم ${adminToDelete.username}`);

        return sendResponse(res, { message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const updateAdminName = async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        const admin = await Admin.findById(id);

        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        admin.username = username;
        await admin.save();
        await handleOperationLog(req.admin.id, 'Update', "admin", id, `تم تحديث اسم الادمن الى ${username}`);

        return sendResponse(res, { admin: { id: admin._id, username: admin.username } });
    } catch (error) {
        console.error('Update admin name error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const updateAdminRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, permissions } = req.body;
        const requestingAdmin = req.admin;

        if (id === requestingAdmin.id) {
            return sendResponse(res, null, 'Cannot change your own role', 400);
        }

        const admin = await Admin.findById(id);
        console.log('Admin found:', admin);
        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        // Don't allow changing supervisor's role
        if (admin.role === 'supervisor' && role !== admin.role) {
            return sendResponse(res, null, 'Cannot change supervisor role', 403);
        }

        // Validate role value
        if (!['user', 'admin'].includes(role)) {
            return sendResponse(res, null, 'Invalid role. Must be either "user" or "admin"', 400);
        }

        admin.role = role;
        admin.permissions = permissions;
        await admin.save();

        await handleOperationLog(requestingAdmin.id, 'Update', "admin", id, `تم تحديث صلاحيات المستخدم الى ${role}`);

        return sendResponse(res, {
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                status: admin.status
            }
        });
    } catch (error) {
        console.error('Update admin role error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const updateAdminStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const requestingAdmin = req.admin;

        if (!['active', 'inactive'].includes(status)) {
            return sendResponse(res, null, 'Invalid status. Must be either "active" or "inactive"', 400);
        }

        const admin = await Admin.findById(id);
        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        admin.status = status;
        await admin.save();
        await handleOperationLog(requestingAdmin.id, 'Update', "admin", id, `تم تحديث حالة المستخدم الى ${status}`);

        return sendResponse(res, { admin: { id: admin._id, username: admin.username, status: admin.status } });
    } catch (error) {
        console.error('Update admin status error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const updateAdminProfile = async (req, res) => {
    try {
        const requestingAdmin = req.admin;
        const { id } = req.params;
        const profile = req.file;

        if (!profile) {
            return sendResponse(res, null, 'No profile image provided', 400);
        }

        const admin = await Admin.findById(id);

        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }


        admin.profile = `/admins_image/${profile.filename}`;
        await admin.save();
        await handleOperationLog(requestingAdmin.id, 'Update', "admin", id, `تم تحديث صورة المستخدم`);

        return sendResponse(res, {
            message: 'Profile updated successfully',
            profile: admin.profile
        });
    } catch (error) {
        console.error('Update admin status error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({ role: { $in: ['admin', 'user'] } })
            .select('-password -refreshToken');

        return sendResponse(res,  admins );
    } catch (error) {
        console.error('Get all admins_image error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const getAllAdminsForFilter = async (req, res) => {
    try {
        const admins = await Admin.find({status: "active"})
            .select('-password -refreshToken -tokenVersion -permissions -role -status -profile -createdAt -updatedAt -email');

        return sendResponse(res,  admins );
    } catch (error) {
        console.error('Get all admins_image error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const requestingAdmin = req.admin;

        if (!newPassword || newPassword.length < 6) {
            return sendResponse(res, null, 'Password must be at least 6 characters long', 400);
        }

        const admin = await Admin.findById(requestingAdmin.id);

        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        admin.password = hashedPassword;
        admin.tokenVersion += 1;
        await admin.save();

        await sendEmail({
            to: admin.email,
            subject: `تم إعادة تعيين كلمة المرور - لوحة تحكم القرآني الصغير`,
            text: `السلام عليكم ورحمة الله وبركاته                           

عزيزي المشرف،                                                              

 تم إعادة تعيين كلمة المرور الخاصة بحسابك في لوحة تحكم القرآني الصغير بنجاح.

                                         ${newPassword}كلمة المرور الجديدة: 

                        يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.

مع أطيب التحيات،                                                           
فريق القرآني الصغير                                                        

                                                                        ---
هذه رسالة تلقائية، يُرجى عدم الرد عليها.                                   `,
            newPassword: newPassword
        });

        await handleOperationLog(requestingAdmin.id, 'Update', "admin", requestingAdmin.id, `تم اعادة تعيين كلمة المرور للمستخدم ${admin.username} `);

        return sendResponse(res, { message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const forgetPassword = async (req, res) => {
    try {
        const {email} = req.body;
        const admin = await Admin.findOne({email: email});

        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        const newPassword = Math.random().toString(36).slice(-8);
        const saltForget = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, saltForget);

        admin.password = hashedPassword;
        admin.tokenVersion += 1;
        await admin.save();

        await sendEmail({
            to: email,
            subject: `تم إعادة تعيين كلمة المرور - لوحة تحكم القرآني الصغير`,
            text: `السلام عليكم ورحمة الله وبركاته                           

عزيزي المشرف،                                                              

 تم إعادة تعيين كلمة المرور الخاصة بحسابك في لوحة تحكم القرآني الصغير بنجاح.

                                         ${newPassword}كلمة المرور الجديدة: 

                        يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.

مع أطيب التحيات،                                                           
فريق القرآني الصغير                                                        

                                                                        ---
هذه رسالة تلقائية، يُرجى عدم الرد عليها.                                   `,
            newPassword: newPassword
        });

        await handleOperationLog(admin._id, 'Update', "admin", admin._id, `تم اعادة تعيين كلمة المرور عشوائية للمستخدم ${admin.username}`);

        return sendResponse(res, { message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};


module.exports = {
    signup,
    login,
    logout,
    refreshAccessToken,
    deleteAdmin,
    updateAdminName,
    updateAdminRole,
    getAllAdmins,
    updateAdminStatus,
    resetPassword,
    forgetPassword,
    getAllAdminsForFilter,
    updateAdminProfile
};
