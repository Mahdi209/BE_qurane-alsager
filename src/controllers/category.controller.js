const Category = require('../models/categories');
const { sendResponse, handleOperationLog, handleDeletion} = require('../Utilities/response');
const Time = require("../models/date");

const categoryController = {
    create: async (req, res) => {
        try {
            const { name, description,app,platform } = req.body;
            const admin = req.admin;

            const existingCategory = await Category.findOne({ name, is_deleted: false });
            if (existingCategory) {
                return sendResponse(res, null, 'Category already exists', 400);
            }

            const category = new Category({ name, description,app,platform,created_by: admin.id });

            const savedCategory = await category.save();

            const time = await Time.create({
                type: 'Category'
            });

            await handleOperationLog(admin.id, 'Create', 'category', savedCategory._id,
                `${admin.username} تم إنشاء تصنيف جديد`);

            return sendResponse(res, savedCategory, null, 201);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },

    getAll: async (req, res) => {
        try {
            const categories = await Category.find({ is_deleted: false });
            return sendResponse(res, categories);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },

    getById: async (req, res) => {
        try {
            const category = await Category.findOne({
                _id: req.params.id,
                is_deleted: false
            });

            if (!category) {
                return sendResponse(res, null, 'Category not found', 404);
            }

            return sendResponse(res, category);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },

    update: async (req, res) => {
        try {
            const { name, description } = req.body;
            const admin = req.admin;

            const category = await Category.findOne({
                _id: req.params.id,
                is_deleted: false
            });

            if (!category) {
                return sendResponse(res, null, 'Category not found', 404);
            }

            if (name && name !== category.name) {
                const existingCategory = await Category.findOne({
                    name,
                    is_deleted: false,
                    _id: { $ne: req.params.id }
                });

                if (existingCategory) {
                    return sendResponse(res, null, 'Category name already exists', 400);
                }
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    description,
                    updated_by: admin.id,
                },
                { new: true, runValidators: true }
            );
            const time = await Time.create({
                type: 'Category'
            });
            await handleOperationLog(admin.id, 'Update', 'category', req.params.id,
                `${admin.username} تم تحديث التصنيف`);

            return sendResponse(res, updatedCategory);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },

    delete: async (req, res) => {
        try {
            const admin = req.admin;
            const category = await Category.findOne({
                _id: req.params.id,
                is_deleted: false
            });

            if (!category) {
                return sendResponse(res, null, 'Category not found', 404);
            }

            await Category.findByIdAndUpdate(req.params.id, {
                is_deleted: true,
                deleted_by: admin.id,
                deleted_at: new Date()
            });
            const time = await Time.create({
                type: 'Category'
            });
            await handleOperationLog(admin.id, 'Delete', 'category', req.params.id,
                `${admin.username} تم حذف التصنيف`);
            await handleDeletion(admin.id, 'category', category._id, ` تم الحذف بواسطة الادمن ${admin.username}`);

            return sendResponse(res, { message: 'Category deleted successfully' });
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },

    getCategoriesForMobile: async (req, res) => {
        try {
            const categories = await Category.find(
                { is_deleted: false},
                'name description'
            );
            return sendResponse(res, categories, null, 200);
        } catch (err) {
            return sendResponse(res, null, err.message, 500);
        }
    },
    getCategoriesForApp: async (req, res) => {
        try {
            const categories = await Category.find(
                { is_deleted: false , app: true},
                'name description'
            );
            return sendResponse(res, categories, null, 200);
        } catch (err) {
            return sendResponse(res, null, err.message, 500);
        }
    },
    getCategoriesForPlatform: async (req, res) => {
        try {
            const categories = await Category.find(
                { is_deleted: false,platform: true},
                'name description'
            );
            return sendResponse(res, categories, null, 200);
        } catch (err) {
            return sendResponse(res, null, err.message, 500);
        }
    },

    restore: async (req, res) => {
        try {
            const admin = req.admin;
            const category = await Category.findOne({
                _id: req.params.id,
                is_deleted: true
            });

            if (!category) {
                return sendResponse(res, null, 'Category not found or is not deleted', 404);
            }

            const existingCategory = await Category.findOne({
                name: category.name,
                is_deleted: false
            });

            if (existingCategory) {
                return sendResponse(res, null, 'A category with this name already exists', 400);
            }

            const restoredCategory = await Category.findByIdAndUpdate(
                req.params.id,
                {
                    is_deleted: false,
                    deleted_by: null,
                    deleted_at: null,
                    updated_by: admin.id,
                },
                { new: true }
            );

            const time = await Time.create({
                type: 'Category'
            });

            await handleOperationLog(
                admin.id,
                'Restore',
                'category',
                req.params.id,
                `${admin.username} تم استعادة التصنيف`
            );

            return sendResponse(res, restoredCategory, null, 200);
        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    }
};

module.exports = categoryController;
