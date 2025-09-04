// middlewares/excelUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dest = 'public/uploads/excel';
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /\.(xlsx|xls)$/i.test(file.originalname);
  ok ? cb(null, true) : cb(new Error('Please upload only Excel files (.xlsx/.xls).'), false);
};

const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = uploadExcel;
