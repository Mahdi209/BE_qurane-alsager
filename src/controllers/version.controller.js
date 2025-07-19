const Version = require("../models/version");
const { sendResponse } = require("../Utilities/response");

const addVersion = async (req, res) => {
    try {
        const { version } = req.body;
        const newVersion = new Version({ version });
        const savedVersion = await newVersion.save();

        return sendResponse(res, savedVersion, null, 201 );
    } catch (error) {
        return sendResponse(res, error.message, null, 500 );
    }
};

// Get all versions
const getAllVersions = async (req, res) => {
    try {
        const versions = await Version.find().sort({ createdAt: -1 });
        return sendResponse(res, versions, null, 200 );
    } catch (error) {
        return sendResponse(res, error.message, null, 500 );
    }
};

// Get latest version for mobile
const getLatestVersion = async (req, res) => {
    try {
        const latestVersion = await Version.findOne().sort({ createdAt: -1 });
        if (!latestVersion) {
            return sendResponse(res, null,  "No version found", 404);
        }
        return sendResponse(res, latestVersion, null, 200);
    } catch (error) {
        return sendResponse(res, error.message, null, 500 );
    }
};

module.exports = {
    addVersion,
    getAllVersions,
    getLatestVersion
};
