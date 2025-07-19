const Suggestion = require('../models/Suggestions');
const { sendResponse,handleOperationLog,handleDeletion } = require('../Utilities/response');

exports.createSuggestion = async (req, res) => {
    try {
        const { name, age, question } = req.body;

        const suggestion = new Suggestion({
            name,
            age,
            question
        });

        await suggestion.save();
        return sendResponse(res, suggestion, null, 201);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.getAllSuggestions = async (req, res) => {
    try {
        const suggestions = await Suggestion.find();
        return sendResponse(res, suggestions, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.getSuggestionById = async (req, res) => {
    try {
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return sendResponse(res, null, "Suggestion not found", 404);
        }
        return sendResponse(res, suggestion, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.updateSuggestion = async (req, res) => {
    try {
        const { name, age, question } = req.body;
        const suggestion = await Suggestion.findByIdAndUpdate(
            req.params.id,
            { name, age, question },
            { new: true }
        );

        if (!suggestion) {
            return sendResponse(res, null, "Suggestion not found", 404);
        }
        await handleOperationLog(req.admin.id, 'Update', 'suggestion', suggestion._id,"تم تحديث الاقتراحات من قبل الادمن "+req.admin.fullName);
        return sendResponse(res, suggestion, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.makeIsCopySuggestion = async (req, res) => {
    try {
        const { id } = req.params;
        const suggestion = await Suggestion.findByIdAndUpdate(
           id,
            { copy: true },
            { new: true }
        );

        if (!suggestion) {
            return sendResponse(res, null, "Suggestion not found", 404);
        }
        await handleOperationLog(req.admin.id, 'Update', 'suggestion', suggestion._id,"تم نسخ الاقتراحات من قبل الادمن "+req.admin.fullName);

        return sendResponse(res, suggestion, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.deleteSuggestion = async (req, res) => {
    try {
        const suggestion = await Suggestion.findByIdAndDelete(req.params.id);


        if (!suggestion) {
            return sendResponse(res, null, "Suggestion not found", 404);
        }
        await handleOperationLog(req.admin.id, 'Update', 'suggestion', suggestion._id,"تم حذف الاقتراحات من قبل الادمن "+req.admin.fullName);
        await handleDeletion(req.admin.id, 'suggestion', suggestion._id, "تم حذف الاقتراحات من قبل الادمن "+req.admin.fullName);
        return sendResponse(res, { message: "Suggestion deleted successfully" }, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};
