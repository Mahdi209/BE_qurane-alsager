const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    deleted_at: { type: Date, default: null },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    app:{
        type: Boolean,
        default: false,
      },
    platform: {
        type: Boolean,
        default: false,
      },
  },
    {
    timestamps: true,
        VersionKey: false,
    }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
