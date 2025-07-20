const mongoose = require("mongoose");

const TimeSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['Question', 'Age', 'Category'],
            required: true
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Time = mongoose.model("Time", TimeSchema);

module.exports = Time;