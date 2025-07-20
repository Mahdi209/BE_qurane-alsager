const Question = require("../models/questions");
const Time = require("../models/date");
const { sendResponse, handleOperationLog, handleDeletion} = require("../Utilities/response");

exports.createQuestion = async (req, res) => {
  try {
    const {
      question_text,
      option1,
      option2,
      option3,
      correctOption,
      timeLimitSec,
      categoryId,
      ageGroupId,
      status,
        app,
        platform
    } = req.body;

    const newQuestion = new Question({
      question_text,
      option1,
      option2,
      option3,
      correctOption,
      timeLimitSec,
      categoryId,
      ageGroupId,
      status,
      created_by: req.admin.id,
        app,
        platform
    });

    await newQuestion.save();
    const time = await Time.create({
        type: 'Question'
    });
    await handleOperationLog(
      req.admin.id,
      'Create',
      'Question',
      newQuestion._id,
      `${req.admin.username} created a new question`
    );

    return sendResponse(res, newQuestion, null, 201);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllQuestionsForMobile = async (req, res) => {
  try {
    const questions = await Question.find({ is_deleted: false, status: true })
      .select('question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec')
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name');

    return sendResponse(res, questions, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllQuestionsForMobileApp = async (req, res) => {
    try {
        const questions = await Question.find({ is_deleted: false, status: true , app: true })
            .select('question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec')
            .populate('categoryId', 'name')
            .populate('ageGroupId', 'name');

        return sendResponse(res, questions, null, 200);
    } catch (err) {
        return sendResponse(res, null, err.message, 500);
    }
};

exports.getAllQuestionsForMobilePlatform = async (req, res) => {
    try {
        const questions = await Question.find({ is_deleted: false, status: true, platform: true })
            .select('question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec')
            .populate('categoryId', 'name')
            .populate('ageGroupId', 'name');

        return sendResponse(res, questions, null, 200);
    } catch (err) {
        return sendResponse(res, null, err.message, 500);
    }
};


exports.getAllQuestionsForDashboard = async (req, res) => {
  try {
    const questions = await Question.find({ is_deleted: false, status: true })
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('deleted_by', 'username');

    return sendResponse(res, questions, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllQuestionsForDashboardBlock = async (req, res) => {
    try {
        const questions = await Question.find({ is_deleted: false,status:false })
            .populate('categoryId', 'name')
            .populate('ageGroupId', 'name')
            .populate('created_by', 'username')
            .populate('updated_by', 'username')
            .populate('deleted_by', 'username');

        return sendResponse(res, questions, null, 200);
    } catch (err) {
        return sendResponse(res, null, err.message, 500);
    }
};

exports.updateStatusQuestion = async (req, res) => {
    try {
        const {
            status
        } = req.body;

        const question = await Question.findOneAndUpdate(
            { _id: req.params.id, is_deleted: false },
            {
                status,
                updated_by: req.admin.id,
            },
            { new: true }
        )   .populate('categoryId', 'name')
            .populate('ageGroupId', 'name')
            .populate('created_by', 'username')
            .populate('updated_by', 'username')
            .populate('deleted_by', 'username');

        if (!question) {
            return sendResponse(res, null, "Question not found", 404);
        }
        const time = await Time.create({
            type: 'Question'
        });
        await handleOperationLog(
            req.admin.id,
            'Update',
            'Question',
            question._id,
            `${req.admin.username} updated a question`
        );

        return sendResponse(res, question, null, 200);
    } catch (err) {
        return sendResponse(res, null, err.message, 500);
    }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      is_deleted: false
    })
    .populate('categoryId', 'name')
    .populate('ageGroupId', 'name')
    .populate('created_by', 'username')
    .populate('updated_by', 'username');

    if (!question) {
      return sendResponse(res, null, "Question not found", 404);
    }

    return sendResponse(res, question, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const {
      question_text,
      option1,
      option2,
      option3,
      correctOption,
      timeLimitSec,
      categoryId,
      ageGroupId,
      status
    } = req.body;

    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      {
        question_text,
        option1,
        option2,
        option3,
        correctOption,
        timeLimitSec,
        categoryId,
        ageGroupId,
        status,
        updated_by: req.admin.id,
      },
      { new: true }
    );

    if (!question) {
      return sendResponse(res, null, "Question not found", 404);
    }
      const time = await Time.create({
          type: 'Question'
      });
    await handleOperationLog(
      req.admin.id,
      'Update',
      'Question',
      question._id,
      `${req.admin.username} updated a question`
    );

    return sendResponse(res, question, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      {
        is_deleted: true,
        deleted_by: req.admin.id,
        deleted_at: new Date(),
      },
      { new: true }
    );

    if (!question) {
      return sendResponse(res, null, "Question not found", 404);
    }
      const time = await Time.create({
          type: 'Question'
      });
    await handleOperationLog(
      req.admin.id,
      'Delete',
      'Question',
      question._id,
      `${req.admin.username} تم حذف هذا السؤال من قبل الادمن `
    );
      await handleDeletion(req.admin.id, 'question', req.params.id, `تم الحذف بواسطة الادمن ${req.admin.username}`);

    return sendResponse(res, { message: "Question deleted successfully" }, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getDeletedQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ is_deleted: true })
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('deleted_by', 'username');

    return sendResponse(res, questions, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.permanentDelete = async (req, res) => {
  try {
    const question = await Question.findOne({ _id: req.params.id });

    if (!question) {
      return sendResponse(res, null, "Question not found", 404);
    }

    await Question.deleteOne({ _id: req.params.id });

    await handleOperationLog(
      req.admin.id,
      'Delete',
      'Question',
      req.params.id,
      `${req.admin.username} تم حذف هذا السؤال نهائيا من قبل المشرف `
    );

    return sendResponse(res, { message: "Question permanently deleted" }, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.restoreQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, is_deleted: true },
      {
        is_deleted: false,
        updated_by: req.admin.id,
        updated_at: new Date(),
            status: true,
      },
      { new: true }
    );

    if (!question) {
      return sendResponse(res, null, "Question not found or is not deleted", 404);
    }

    const time = await Time.create({
      type: 'Question'
    });

    await handleOperationLog(
      req.admin.id,
      'Restore',
      'Question',
      question._id,
      `${req.admin.username} تم استعادة هذا السؤال من قبل الادمن`
    );

    return sendResponse(res, question, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};
