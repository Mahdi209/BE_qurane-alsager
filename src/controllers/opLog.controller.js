const OperationLog = require('../models/operations_log');
const { sendResponse } = require('../Utilities/response');

exports.getLogs = async (req, res) => {
    try {
        const logs = await OperationLog.find()
            .populate('admin_id', 'username email')
            .sort({ createdAt: -1 });
        return sendResponse(res, logs, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};
