const  Question  = require('../models/questions');
const Category  = require('../models/categories');
const AgeGroup = require('../models/age_groups');
const { sendResponse } = require('../Utilities/response');

const searchByIdAndType = async (req, res) => {
    try {
        const { id, type } = req.params;
        console.log(`Searching for ${type} with id: ${id}`);
        let result;
        switch (type.toLowerCase()) {
            case 'category':
                result = await Category.findById(id)
                    .populate('deleted_by', 'username email')
                    .populate("updated_by", "username email")
                    .populate("created_by", "username email")
                break;
            case 'age_group':
                result = await AgeGroup.findById(id)
                    .populate('deleted_by', 'username email')
                break;
            case 'question':
                result = await Question.findById(id)
                    .populate('deleted_by', 'username email')
                    .populate("updated_by", "username email")
                    .populate("created_by", "username email")
                    .populate('categoryId', 'name')
                    .populate('ageGroupId', 'name')
                break;
            default:
                return sendResponse(res, null, 'Invalid type', 400);
        }

        if (!result) {
            return sendResponse(res, null,`${type} not found with id: ${id}`, 404);
        }

        return sendResponse(res, result,null,200);
    } catch (error) {
        console.error('Search error:', error);
        return sendResponse(res,null, error.message, 500);
    }
};

module.exports = {
    searchByIdAndType
};
