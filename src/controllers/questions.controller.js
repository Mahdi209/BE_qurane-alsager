const Question = require('../models/questions');
const Time = require('../models/date');
const { sendResponse, handleOperationLog, handleDeletion } = require('../Utilities/response');
const { getIO } = require('../socket');
const path = require('path');
const fs = require('fs').promises;
const XLSX = require('xlsx');
const mongoose = require('mongoose');

const REQUIRED_COLS = [
  'question_text',
  'option1',
  'option2',
  'option3',
  'correctOption',
  'timeLimitSec',
  'status',
  'app',
  'platform',
];

// يحوّل 1..3 أو option1/2/3 إلى فهرس 0..2
function normalizeCorrectIndex(value) {
  if (typeof value === 'number') return value - 1;
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10) - 1;
  if (s === 'option1') return 0;
  if (s === 'option2') return 1;
  if (s === 'option3') return 2;
  return -1;
}

// يحوّل قيم منطقية شائعة إلى Boolean
function parseBoolean(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  return null; // غير صالح
}

function isRowCompletelyEmpty(r) {
  return REQUIRED_COLS.every((c) => String(r[c] ?? '').trim() === '');
}

function rowNumberOf(r) {
  // __rowNum__ صفرية الأساس → +1 يعطي رقم الصف الحقيقي في الإكسل
  return typeof r.__rowNum__ === 'number' ? r.__rowNum__ + 1 : '(unknown)';
}
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
      platform,
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
      platform,
    });

    // احفظ أولاً
    const savedQuestion = await newQuestion.save();

    // ثم اعمل populate
    const populatedQuestion = await Question.findById(savedQuestion._id)
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('deleted_by', 'username');

    const time = await Time.create({
      type: 'Question',
    });

    await handleOperationLog(
      req.admin.id,
      'Create',
      'Question',
      savedQuestion._id,
      `${req.admin.username} created a new question`,
    );

    getIO().emit(`questions/${savedQuestion.status}`, populatedQuestion);

    return sendResponse(res, populatedQuestion, null, 201);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllQuestionsForMobile = async (req, res) => {
  try {
    const questions = await Question.find({ is_deleted: false, status: true })
      .select(
        'question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec',
      )
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name');

    return sendResponse(res, questions, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllQuestionsForMobileApp = async (req, res) => {
  try {
    const questions = await Question.find({ is_deleted: false, status: true, app: true })
      .select(
        'question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec',
      )
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name');

    return sendResponse(res, questions, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllQuestionsForAllAgeGroup = async (req, res) => {
  try {
    const questions = await Question.find({ is_deleted: false, status: true, ageGroupId: null })
      .select(
        'question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec',
      )
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
      .select(
        'question_text option1 option2 option3 correctOption categoryId ageGroupId status timeLimitSec',
      )
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
    const questions = await Question.find({ is_deleted: false, status: false })
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
    const { status } = req.body;

    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      {
        status,
        updated_by: req.admin.id,
      },
      { new: true },
    )
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('deleted_by', 'username');

    if (!question) {
      return sendResponse(res, null, 'Question not found', 404);
    }
    const time = await Time.create({
      type: 'Question',
    });
    await handleOperationLog(
      req.admin.id,
      'Update',
      'Question',
      question._id,
      `${req.admin.username} updated a question`,
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
      is_deleted: false,
    })
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!question) {
      return sendResponse(res, null, 'Question not found', 404);
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
      status,
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
      { new: true },
    )
      .populate('categoryId', 'name')
      .populate('ageGroupId', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('deleted_by', 'username');

    if (!question) {
      return sendResponse(res, null, 'Question not found', 404);
    }
    const time = await Time.create({
      type: 'Question',
    });

    await handleOperationLog(
      req.admin.id,
      'Update',
      'Question',
      question._id,
      `${req.admin.username} updated a question`,
    );
    getIO().emit(`updateQuestion`, question);

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
      { new: true },
    );

    if (!question) {
      return sendResponse(res, null, 'Question not found', 404);
    }
    const time = await Time.create({
      type: 'Question',
    });
    await handleOperationLog(
      req.admin.id,
      'Delete',
      'Question',
      question._id,
      `${req.admin.username} تم حذف هذا السؤال من قبل الادمن `,
    );
    await handleDeletion(
      req.admin.id,
      'question',
      req.params.id,
      `تم الحذف بواسطة الادمن ${req.admin.username}`,
    );
    getIO().emit(`deleteQuestions`, question._id);
    return sendResponse(res, { message: 'Question deleted successfully' }, null, 200);
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
      return sendResponse(res, null, 'Question not found', 404);
    }

    await Question.deleteOne({ _id: req.params.id });

    await handleOperationLog(
      req.admin.id,
      'Delete',
      'Question',
      req.params.id,
      `${req.admin.username} تم حذف هذا السؤال نهائيا من قبل المشرف `,
    );

    return sendResponse(res, { message: 'Question permanently deleted' }, null, 200);
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
      { new: true },
    );

    if (!question) {
      return sendResponse(res, null, 'Question not found or is not deleted', 404);
    }

    const time = await Time.create({
      type: 'Question',
    });

    await handleOperationLog(
      req.admin.id,
      'Restore',
      'Question',
      question._id,
      `${req.admin.username} تم استعادة هذا السؤال من قبل الادمن`,
    );

    return sendResponse(res, question, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.importQuestionsByExcel = async (req, res) => {
  const { categoryId, AgeGroupId } = req.params;
  const adminId = req.admin.id;
  const { file } = req;

  if (!file)
    return res.status(400).json({ message: 'Please upload an Excel file in field \"file\".' });

  if (!mongoose.isValidObjectId(categoryId) || !mongoose.isValidObjectId(AgeGroupId)) {
    if (file?.path) fs.unlink(file.path, () => {});
    return res.status(400).json({ message: 'Invalid categoryId or AgeGroupId.' });
  }

  try {
    const wb = XLSX.readFile(file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];

    // تحقق العناوين
    const headerRow = (XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 })[0] || []).map(String);
    const missing = REQUIRED_COLS.filter((c) => !headerRow.includes(c));
    if (missing.length) {
      return res.status(400).json({ message: 'Missing required columns', missing });
    }

    // حمّل الصفوف (raw:true حتى نستلم booleans كـ true/false بدل نصوص)
    const rowsRaw = XLSX.utils.sheet_to_json(ws, {
      defval: '',
      raw: true,
      blankrows: false,
    });

    // تجاهل الصفوف الفارغة كليًا
    const rows = rowsRaw.filter((r) => !isRowCompletelyEmpty(r));
    if (!rows.length) {
      return res.status(400).json({ message: 'Excel file has no data rows.' });
    }

    const errors = [];
    const docs = [];

    rows.forEach((r) => {
      const excelRow = rowNumberOf(r);

      const question_text = String(r.question_text || '').trim();
      const option1 = String(r.option1 || '').trim();
      const option2 = String(r.option2 || '').trim();
      const option3 = String(r.option3 || '').trim();
      if (!question_text || !option1 || !option2 || !option3) {
        errors.push(`Row ${excelRow}: question_text/option1/option2/option3 are required.`);
        return;
      }

      const correctIndex = normalizeCorrectIndex(r.correctOption);
      if (![0, 1, 2].includes(correctIndex)) {
        errors.push(`Row ${excelRow}: correctOption must be 1..3 or option1/option2/option3.`);
        return;
      }
      const correctOption = correctIndex + 1; // 1..3 للسكيمة

      const timeLimitSec = Number(r.timeLimitSec);
      if (!Number.isFinite(timeLimitSec) || timeLimitSec <= 0) {
        errors.push(`Row ${excelRow}: timeLimitSec must be a positive number.`);
        return;
      }

      const status = Boolean(r.status || '');

      const appBool = parseBoolean(r.app);
      if (appBool === null) {
        errors.push(`Row ${excelRow}: app must be boolean (true/false, 1/0, yes/no).`);
        return;
      }

      const platformBool = parseBoolean(r.platform);
      if (platformBool === null) {
        errors.push(`Row ${excelRow}: platform must be boolean (true/false, 1/0, yes/no).`);
        return;
      }

      // ابنِ المستند حسب سكيمتك (option1/2/3 كحقول منفصلة كما كتبت)
      docs.push({
        categoryId: new mongoose.Types.ObjectId(categoryId),
        ageGroupId: new mongoose.Types.ObjectId(AgeGroupId),
        question_text,
        option1,
        option2,
        option3,
        correctOption, // <-- مطلوب بالسكيمة
        timeLimitSec,
        status,
        created_by: adminId,
        app: appBool, // <-- Boolean مضبوط
        platform: platformBool, // <-- Boolean مضبوط
      });
    });

    if (errors.length) {
      return res.status(400).json({ message: 'Validation errors in uploaded Excel', errors });
    }

    const result = await Question.insertMany(docs);
    return res.status(201).json({
      message: 'Questions imported successfully.',
      inserted: result.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to import questions', error: err.message });
  } finally {
    if (file?.path) fs.unlink(file.path, () => {});
  }
};

exports.downloadQuestionsTemplate = async (req, res) => {
  const fileName = 'question_template.xlsx';

  // نفس مجلد الستاتك المستخدم في app.js
  const filesDir = req.app.locals.FILES_DIR;
  const filePath = path.join(filesDir, fileName);

  try {
    await fs.access(filePath); // يفشل إذا الملف مو موجود
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return res.download(filePath, fileName, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ message: 'Template not found' });
        }
        return res.status(500).json({ message: 'Failed to send file', error: err.message });
      }
    });
  } catch (e) {
    return res.status(404).json({
      message: 'Template not found',
      tried: [filePath],
      error: e.code || e.message,
    });
  }
};
