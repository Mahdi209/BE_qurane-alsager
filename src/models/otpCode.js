const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        otp: {
            type: String,
            required: true,
            unique: true,
        },
        email:{
            type: String,
            required: true,
            unique: true,
        },
        expiryDate: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 2 * 60 * 1000)
            },
        expiry: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;