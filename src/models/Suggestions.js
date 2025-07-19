const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        question: { type: String, required: true },
        copy: { type: Boolean,default: false },
    },
    {
        timestamps: true,
        VersionKey: false,
    });

const suggestion = mongoose.model("suggestions", suggestionSchema);

module.exports = suggestion;
