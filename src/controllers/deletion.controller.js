const Deletion = require('../models/deletions');
const { sendResponse } = require('../Utilities/response');

exports.getDeletion = async (req, res) => {
    try {
        const deletions = await Deletion.find()
            .populate('deleted_by', '-tokenVersion -refreshToken -password -__v -permissions')
            .sort({ createdAt: -1 });

        // Dynamically populate entity_id based on entity_type
        for (let deletion of deletions) {
            const modelMap = {
                question: 'Question',
                category: 'Category',
                age_group: 'AgeGroup',
                admin: 'Admin'
            };

            await deletion.populate({
                path: 'entity_id',
                model: modelMap[deletion.entity_type]
            });
        }

        return sendResponse(res, deletions, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};