const Version = require("../models/appLink");
const { sendResponse } = require("../Utilities/response");

const addAppLink = async (req, res) => {
    try {
        const { android,ios } = req.body;
        const newAppLink = new Version({ android,ios });
        const savedAppLink = await newAppLink.save();

        return sendResponse(res, savedAppLink, null, 201 );
    } catch (error) {
        return sendResponse(res, error.message, null, 500 );
    }
};

// Get all versions
const getAppLink = async (req, res) => {
    try {
        const appLink = await Version.find().sort({ createdAt: -1 });
        return sendResponse(res, appLink, null, 200 );
    } catch (error) {
        return sendResponse(res, error.message, null, 500 );
    }
};

const getLastAppLink = async (req, res) => {
    try {
        const latestAppLink = await Version.findOne().sort({ createdAt: -1 });
        if (!latestAppLink) {
            return sendResponse(res, null,  "No AppLink found", 404);
        }
        return sendResponse(res, latestAppLink, null, 200);
    } catch (error) {
        return sendResponse(res, error.message, null, 500 );
    }
};

const updateAppLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { android, ios } = req.body;

        const updatedAppLink = await Version.findByIdAndUpdate(
            id,
            { android, ios },
            { new: true }
        );

        if (!updatedAppLink) {
            return sendResponse(res, null, "AppLink not found", 404);
        }

        return sendResponse(res, updatedAppLink, null, 200);
    } catch (error) {
        return sendResponse(res, null, error.message, 500);
    }
};

module.exports = {
    addAppLink,
    getAppLink,
    getLastAppLink,
    updateAppLink
};
