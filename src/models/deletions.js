const mongoose = require("mongoose");

const deletionsSchema = new mongoose.Schema(
  {
    entity_type: {
      type: String,
      enum: ["question", "category", "age_group", "admin"],
      required: true,
    },
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    deleted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    deleted_at: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
    },
  },
    {
        timestamps: true,
        versionKey: false,
    });

const Deletion = mongoose.model("Deletion", deletionsSchema);

module.exports = Deletion;
