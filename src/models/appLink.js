const mongoose = require("mongoose");

const appLinkSchema = new mongoose.Schema(
    {
     android:{
            type: String,
            required: false,
     },
        ios:{
            type: String,
            required: false,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    });

const AppLink = mongoose.model("AppLinkGroup", appLinkSchema);

module.exports = AppLink;
