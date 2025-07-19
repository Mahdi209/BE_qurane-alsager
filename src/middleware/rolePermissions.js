const { sendResponse } = require('../Utilities/response');

const checkPermission = (resourceType, action) => {
    return async (req, res, next) => {
        try {
            const admin = req.admin;

            // If no admin or no role assigned
            if (!admin || !admin.permissions || !admin.permissions) {
                return sendResponse(res, null, 'Unauthorized - Insufficient permissions', 403);
            }

            const permissions = admin.permissions;

            if (!permissions[resourceType]) {
                return sendResponse(res, null, `Unauthorized - No ${resourceType} permissions defined`, 403);
            }

            // Check if the specific action is allowed
            if (!permissions[resourceType][action]) {
                return sendResponse(res, null, `Unauthorized - No permission to ${action} ${resourceType}`, 403);
            }

            // Permission granted
            next();
        } catch (error) {
            return sendResponse(res, null, 'Error checking permissions: ' + error.message, 500);
        }
    };
};

// Category permissions middleware
const canCreateCategory = checkPermission('category', 'create');
const canReadCategory = checkPermission('category', 'read');
const canUpdateCategory = checkPermission('category', 'update');
const canDeleteCategory = checkPermission('category', 'delete');

// Age Group permissions middleware
const canCreateAgeGroup = checkPermission('ageGroup', 'create');
const canReadAgeGroup = checkPermission('ageGroup', 'read');
const canUpdateAgeGroup = checkPermission('ageGroup', 'update');
const canDeleteAgeGroup = checkPermission('ageGroup', 'delete');

// Question permissions middleware
const canCreateQuestion = checkPermission('question', 'create');
const canReadQuestion = checkPermission('question', 'read');
const canUpdateQuestion = checkPermission('question', 'update');
const canDeleteQuestion = checkPermission('question', 'delete');

module.exports = {
    canCreateCategory,
    canReadCategory,
    canUpdateCategory,
    canDeleteCategory,
    canCreateAgeGroup,
    canReadAgeGroup,
    canUpdateAgeGroup,
    canDeleteAgeGroup,
    canCreateQuestion,
    canReadQuestion,
    canUpdateQuestion,
    canDeleteQuestion
};
