const AgeGroup = require("../models/age_groups");
const { sendResponse, handleOperationLog,handleDeletion } = require("../Utilities/response");
const Time = require("../models/date");

exports.createAgeGroup = async (req, res) => {
  try {
    const { name, minAge, maxAge,skip } = req.body;
    const admin = req.admin;

    const newAgeGroup = new AgeGroup({
      name,
      minAge,
      maxAge,
      skip,
    });
    await newAgeGroup.save();
      const time = await Time.create({
          type: 'Age',
      });
    await handleOperationLog(admin.id, 'Create', 'age_group', newAgeGroup._id,
      `${admin.username} تم إنشاء تصنيف عمر جديد`);
    return sendResponse(res, newAgeGroup, null, 201);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAllAgeGroups = async (req, res) => {
  try {
    const ageGroups = await AgeGroup.find({ is_deleted: false });
    return sendResponse(res, ageGroups, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getAgeGroupsForMobile = async (req, res) => {
  try {
    const ageGroups = await AgeGroup.find({ is_deleted: false })
      .select('_id name minAge maxAge');
    return sendResponse(res, ageGroups, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const ageGroup = await AgeGroup.findById(req.params.id);
    if (!ageGroup || ageGroup.is_deleted) {
      return sendResponse(res, null, "Age group not found", 404);
    }
    return sendResponse(res, ageGroup, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, minAge, maxAge } = req.body;
    const admin = req.admin;

    const ageGroup = await AgeGroup.findById(req.params.id);
    if (!ageGroup || ageGroup.is_deleted) {
      return sendResponse(res, null, "Age group not found", 404);
    }

    ageGroup.name = name || ageGroup.name;
    ageGroup.minAge = minAge || ageGroup.minAge;
    ageGroup.maxAge = maxAge || ageGroup.maxAge;
    ageGroup.updated_by = admin.id;

    await ageGroup.save();
    await handleOperationLog(admin.id, 'Update', 'age_group', ageGroup._id,
      `${admin.username} تم تحديث تصنيف العمر`);
      const time = await Time.create({
          type: 'Age',
      });
    return sendResponse(res, ageGroup, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.delete = async (req, res) => {
  try {
    const admin = req.admin;
    const ageGroup = await AgeGroup.findById(req.params.id);

    if (!ageGroup || ageGroup.is_deleted) {
      return sendResponse(res, null, "Age group not found", 404);
    }

    ageGroup.is_deleted = true;
    ageGroup.deleted_at = Date.now();
    ageGroup.deleted_by = admin.id;

    await ageGroup.save();
    await handleOperationLog(admin.id, 'Delete', 'age_group', ageGroup._id,
      `${admin.username} تم حذف تصنيف العمر`);

    await handleDeletion(admin.id, 'age_group', ageGroup._id, `تم الحذف بواسطة الادمن ${admin.username}`);
    return sendResponse(res, { message: "Age group deleted successfully" }, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.getDeleted = async (req, res) => {
  try {
    const deletedAgeGroups = await AgeGroup.find({ is_deleted: true });
    return sendResponse(res, deletedAgeGroups, null, 200);
  } catch (err) {
    return sendResponse(res, null, err.message, 500);
  }
};

exports.restore = async (req, res) => {
  try {
    const admin = req.admin;
    const ageGroup = await AgeGroup.findOne({
      _id: req.params.id,
      is_deleted: true
    });

    if (!ageGroup) {
      return sendResponse(res, null, 'Age group not found or is not deleted', 404);
    }

    const existingAgeGroup = await AgeGroup.findOne({
      name: ageGroup.name,
      is_deleted: false
    });

    if (existingAgeGroup) {
      return sendResponse(res, null, 'An age group with this name already exists', 400);
    }

    const restoredAgeGroup = await AgeGroup.findByIdAndUpdate(
      req.params.id,
      {
        is_deleted: false,
        deleted_by: null,
        deleted_at: null,
        updated_by: admin.id,
      },
      { new: true }
    );

    const time = await Time.create({
      type: 'Age'
    });

    await handleOperationLog(
      admin.id,
      'Restore',
      'age_group',
      req.params.id,
      `${admin.username} تم استعادة تصنيف العمر`
    );

    return sendResponse(res, restoredAgeGroup, null, 200);
  } catch (error) {
    return sendResponse(res, null, error.message, 500);
  }
};
