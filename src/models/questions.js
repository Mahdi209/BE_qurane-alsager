const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question_text: { type: String, required: true },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    option3: { type: String, required: true },
    correctOption: { type: String, required: true },
    timeLimitSec: { type: Number, default: 30 },
    is_deleted: { type: Boolean, default: false },
    status: {
      type: Boolean,
      default: true,
    },
    deleted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    deleted_at: { type: Date, default: null },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      default: null,

    },
    ageGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgeGroup",
      required: false,
      default: null,
    },
    app: {
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
        versionKey: false,
    }
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
