const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
    {
        version: { type: String, required: true },
    },
    {
        timestamps: true,
        VersionKey: false,
    });

const Version = mongoose.model("Version", versionSchema);

module.exports = Version;
