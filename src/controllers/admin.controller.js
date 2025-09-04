const bcrypt = require('bcryptjs');
const Admin = require('../models/admins');
const Otp = require('../models/otpCode');
const { signupSchema, loginSchema } = require('../Validation/admin.validation');
const { generateTokens, verifyRefreshToken } = require('../Utilities/tokens');
const { sendResponse,handleOperationLog } = require('../Utilities/response');
const { sendEmail,sendOTPToEmail,sendAccountVerifiedEmail } = require("../Utilities/email");

const signup = async (req, res) => {
    try {
        const requestingAdmin = req.admin;
        const profile = req.file;

        // Validate request body
        const { error } = signupSchema.validate(req.body);
        if (error) {
            return sendResponse(res, null, error.details[0].message, 400);
        }

        const { username, email, role = 'user', fullName, permissions,password } = req.body;

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
            `طھظ… ط§ظ†ط´ط§ط، ط­ط³ط§ط¨ ظ…ط³طھط®ط¯ظ… ط¨ط§ط³ظ… ${admin.username}`
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
            return  res.status(404).json({ Access: false });
        }

        await handleOperationLog(admin._id, 'Update', "admin", admin._id, `تم طلب نسيان كلمة السر`);

        return  res.status(200).json({ Access: true });

    } catch (error) {
        console.error('Reset password error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return sendResponse(res, null, 'Email is required', 400);
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        // Formatter for Mecca time (Asia/Riyadh)
        const formatMecca = (date) =>
            new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Riyadh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date);

        // Check if there is an active (non-expired, not marked as expired) OTP
        const existing = await Otp.findOne({ email: admin.email, expiry: false });
        if (existing) {
            const now = Date.now();
            const expMs = new Date(existing.expiryDate).getTime();

            if (expMs > now) {
                // An active OTP still exists — do NOT create a new one
                const secondsLeft = Math.ceil((expMs - now) / 1000);
                return sendResponse(
                    res,
                    {
                        message: 'An active OTP already exists',
                        expiry: existing.expiryDate.toISOString(),
                        expiryMecca: formatMecca(new Date(existing.expiryDate)),
                        secondsLeft
                    },
                    null,
                    200
                );
            } else {
                // OTP expired — mark it as expired before creating a new one
                try { await Otp.updateOne({ _id: existing._id }, { $set: { expiry: true } }); } catch (_) {}
            }
        }

        // Generate and save a new OTP, retrying if a unique conflict occurs on the `otp` field
        const generateAndSaveOTP = async (attempt = 0) => {
            if (attempt >= 5) throw new Error('Failed to generate unique OTP');

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const newExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

            try {
                const otpDoc = await Otp.findOneAndUpdate(
                    { email: admin.email },
                    { otp: otpCode, expiryDate: newExpiry, expiry: false },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                return {
                    otp: otpCode,
                    expiryISO: otpDoc.expiryDate.toISOString(),
                    expiryDate: otpDoc.expiryDate
                };
            } catch (err) {
                // Handle duplicate key error on the unique `otp` field
                if (err && err.code === 11000 && err.keyPattern && err.keyPattern.otp) {
                    return generateAndSaveOTP(attempt + 1);
                }
                throw err;
            }
        };

        const otpData = await generateAndSaveOTP();

        await sendOTPToEmail({
            to: admin.email,
            subject: 'OTP Code - Small Qurani Admin Panel',
            otp: otpData.otp,
            expiresInMinutes: 2,
            loginUrl: '#'
        });

        return sendResponse(
            res,
            {
                message: 'OTP sent successfully',
                expiry: formatMecca(new Date(otpData.expiryDate))
            },
            null,
            200
        );
    } catch (error) {
        console.error('Send OTP error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email) {
            return sendResponse(res, null, 'Email is required', 400);
        }
        if (!otp) {
            return sendResponse(res, null, 'OTP is required', 400);
        }
        if (!newPassword || newPassword.length < 6) {
            return sendResponse(res, null, 'Password must be at least 6 characters long', 400);
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        // نتحقق من الكود
        const otpDoc = await Otp.findOne({ email: admin.email, otp: String(otp), expiry: false });
        if (!otpDoc) {
            return sendResponse(res, null, 'Invalid OTP', 400);
        }

        // انتهاء الصلاحية؟
        if (new Date(otpDoc.expiryDate).getTime() < Date.now()) {
            // نعلمه منتهي حتى ما ينستخدم مرة ثانية
            try { await Otp.updateOne({ _id: otpDoc._id }, { $set: { expiry: true } }); } catch (_) {}
            return sendResponse(res, null, 'OTP has expired', 400);
        }

        // نحدّث كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        admin.password = hashedPassword;
        admin.tokenVersion = (admin.tokenVersion || 0) + 1;
        await admin.save();

        // نبطل الكود بعد الاستخدام
        try {
            await Otp.updateOne({ _id: otpDoc._id }, { $set: { expiry: true } });
        } catch (_) {}

        // نرسل إشعار بالإيميل (الدالة الأصلية مالّتك)
        await sendEmail({
            to: admin.email,
            subject: `تم إعادة تعيين كلمة المرور - لوحة تحكم القرآني الصغير`,
            text: `السلام عليكم ورحمة الله وبركاته

عزيزي المشرف،

تم إعادة تعيين كلمة المرور الخاصة بحسابك في لوحة تحكم القرآني الصغير بنجاح.

كلمة المرور الجديدة: ${newPassword}

يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.

مع أطيب التحيات،
فريق القرآني الصغير

---
هذه رسالة تلقائية، يُرجى عدم الرد عليها.`,
            newPassword: newPassword
        });

        return sendResponse(res, { message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return sendResponse(res, null, 'Internal server error', 500);
    }
};

const verifyTheAccount = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return sendResponse(res, null, 'OTP is required', 400);
        }

        // Find an active (not marked expired) OTP document by code
        const otpDoc = await Otp.findOne({ otp: String(otp), expiry: false });
        if (!otpDoc) {
            return sendResponse(res, null, 'Invalid OTP code', 400);
        }

        // Check expiration
        if (new Date(otpDoc.expiryDate).getTime() < Date.now()) {
            try { await Otp.updateOne({ _id: otpDoc._id }, { $set: { expiry: true } }); } catch (_) {}
            return sendResponse(res, null, 'OTP has expired', 400);
        }

        // Find the admin by the email stored in the OTP doc
        const admin = await Admin.findOne({ email: otpDoc.email });
        if (!admin) {
            return sendResponse(res, null, 'Admin not found', 404);
        }

        // If already verified, just invalidate the OTP and return success info
        if (admin.verifyEmail === true) {
            try { await Otp.updateOne({ _id: otpDoc._id }, { $set: { expiry: true } }); } catch (_) {}
            return sendResponse(
                res,
                {
                    verified: true,
                    alreadyVerified: true,
                    verifiedAt: admin.dateVerifyEmail ? admin.dateVerifyEmail.toISOString() : null
                },
                'Account is already verified',
                200
            );
        }

        // Mark admin as verified
        admin.verifyEmail = true;
        admin.dateVerifyEmail = new Date();
        await admin.save();

        // Invalidate OTP after successful verification
        try { await Otp.updateOne({ _id: otpDoc._id }, { $set: { expiry: true } }); } catch (_) {}

        // Send "account activated" email (non-blocking for the response)
        try {
            await sendAccountVerifiedEmail({ to: admin.email });
        } catch (e) {
            console.error('sendAccountVerifiedEmail error:', e);
            // do not fail the request because of email issues
        }

        return sendResponse(
            res,
            {
                verified: true,
                verifiedAt: admin.dateVerifyEmail.toISOString()
            },
            'Account verified successfully',
            200
        );
    } catch (error) {
        console.error('Verify account error:', error);
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
    updateAdminProfile,
    sendOTP,
    resetPasswordWithOTP,
    verifyTheAccount
};
