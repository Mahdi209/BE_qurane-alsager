const Role = require('../models/roles');
const { sendResponse } = require('../Utilities/response');
const { handleOperationLog } = require('../Utilities/response');

const roleController = {
    create: async (req, res) => {
        try {
            const { name, permissions } = req.body;
            const admin = req.admin;

            const existingRole = await Role.findOne({ name });

            if (existingRole) {
                return sendResponse(res, null, 'Role already exists', 400);
            }

            const role = new Role({ name, permissions });
            const savedRole = await role.save();
            await handleOperationLog(admin.id, 'Create', 'role', savedRole._id, `${admin.username}تم عمل صلاحية جديدة من قبل المشرف ` );

            return sendResponse(res, savedRole, null, 201);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },
    getAll: async (req, res) => {
        try {
            const roles = await Role.find();
            return sendResponse(res, roles);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },
    getById: async (req, res) => {
        try {
            const role = await Role.findById(req.params.id);
            if (!role) {
                return sendResponse(res, null, 'Role not found', 404);
            }
            return sendResponse(res, role);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },
    update: async (req, res) => {
        try {
            const { name, permissions } = req.body;
            const admin = req.admin;
            const role = await Role.findById(req.params.id);
            if (!role) {
                return sendResponse(res, null, 'Role not found', 404);
            }

            if (name && name !== role.name) {
                const existingRole = await Role.findOne({ name });
                if (existingRole) {
                    return sendResponse(res, null, 'Role name already exists', 400);
                }
            }

            const updatedRole = await Role.findByIdAndUpdate(
                req.params.id,
                { name, permissions },
                { new: true, runValidators: true }
            );
            await handleOperationLog(admin.id, 'Update', 'role', req.params.id, `${admin.username}تم عمل تحديث لصلاحية من قبل الادمن ` );

            return sendResponse(res, updatedRole);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },
    delete: async (req, res) => {
        try {
            const role = await Role.findByIdAndDelete(req.params.id);
            const admin = req.admin;
            if (!role) {
                return sendResponse(res, null, 'Role not found', 404);
            }
           await handleOperationLog(admin.id, 'Delete', 'role', req.params.id, `${admin.username}تم حذف صلاحية من قبل الادمن ` );
            return sendResponse(res, { message: 'Role deleted successfully' });
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    }
};

module.exports = roleController;
