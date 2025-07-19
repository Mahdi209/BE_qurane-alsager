const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        VersionKey: false,
    });

const Contact = mongoose.model("Contacts", contactSchema);

module.exports = Contact;
