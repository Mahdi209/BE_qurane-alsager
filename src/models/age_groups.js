const mongoose = require("mongoose");

const ageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    minAge: { type: Number, required: false,default: 0 },
    maxAge: { type: Number, required: false,default: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    deleted_at: { type: Date },
    skip: { type: Boolean, default: false },
  },
    {
        timestamps: true,
        versionKey: false,
    });

const AgeGroup = mongoose.model("AgeGroup", ageSchema);

module.exports = AgeGroup;
