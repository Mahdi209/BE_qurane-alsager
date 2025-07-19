const OperationsLog = require('../models/operations_log');
const Deletion = require('../models/deletions');


const sendResponse = (res, data = null, error = null, statusCode = 200) => {
    const response = {};

    if (error) {
        response.success = false;
        response.error = error;
        response.data = null;
    } else {
        response.success = true;
        response.error = null;
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

const handleOperationLog = async (admin_id, operation, entity_type, entity_id, details = null) => {
    try {
        await OperationsLog.create({
            admin_id,
            operation,
            entity_type,
            entity_id,
            details
        });
    } catch (error) {
        console.error('Error logging operation:', error);
    }
};

const handleDeletion = async ( deleted_by, entity_type, entity_id, reason = null) => {
    try {
        await Deletion.create({
            deleted_by,
            entity_type,
            entity_id,
            reason
        });
    } catch (error) {
        console.error('Error logging operation:', error);
    }
};

module.exports = {
    sendResponse,
    handleOperationLog,
    handleDeletion
};
