const Contact = require('../models/contactUs');
const { sendResponse,handleOperationLog,handleDeletion } = require('../Utilities/response');

exports.createContact = async (req, res) => {
    try {
        const { name, age, message } = req.body;

        const contactMessage = new Contact({
            name,
            age,
            message
        });

        await contactMessage.save();
        return sendResponse(res, contactMessage, null, 201);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contactMessage = await Contact.find();
        return sendResponse(res, contactMessage, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.getContactById = async (req, res) => {
    try {
        const contactMessage = await Contact.findById(req.params.id);
        if (!contactMessage) {
            return sendResponse(res, null, "contactMessage not found", 404);
        }
        return sendResponse(res, contactMessage, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.updateContact= async (req, res) => {
    try {
        const { name, age, message } = req.body;
        const contactMessage = await Contact.findByIdAndUpdate(
            req.params.id,
            { name, age, message },
            { new: true }
        );

        if (!contactMessage) {
            return sendResponse(res, null, "contactMessage not found", 404);
        }
        await handleOperationLog(req.admin.id, 'Update', 'contactMessage', contactMessage._id,"تم تحديث رساله التواصل معنا من قبل الادمن "+req.admin.fullName);
        return sendResponse(res, contactMessage, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

exports.makeIsRead= async (req, res) => {
    try {
        const { id } = req.params;
        const contactMessage = await Contact.findByIdAndUpdate(
        id,
            { isRead: true },
            { new: true }
        );

        if (!contactMessage) {
            return sendResponse(res, null, "contactMessage not found", 404);
        }
        await handleOperationLog(req.admin.id, 'Update', 'contactMessage', contactMessage._id,"تم تحديث قرائة رساله التواصل معنا من قبل الادمن "+req.admin.fullName);

        return sendResponse(res, contactMessage, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};


exports.deleteContact = async (req, res) => {
    try {
        const contactMessage = await Contact.findByIdAndDelete(req.params.id);

        if (!contactMessage) {
            return sendResponse(res, null, "contactMessage not found", 404);
        }
        await handleOperationLog(req.admin.id, 'Delete', 'contactMessage', contactMessage._id,"تم حذف  رساله من صفحة التواصل معنا من قبل الادمن "+req.admin.fullName);
        await handleDeletion(req.admin.id, 'contactMessage', contactMessage._id,"تم حذف رساله من صفحة التواصل معنا من قبل الادمن "+req.admin.fullName);
        return sendResponse(res, { message: "contactMessage deleted successfully" }, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};
