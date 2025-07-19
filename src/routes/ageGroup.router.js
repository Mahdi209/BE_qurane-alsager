const express = require("express");
const router = express.Router();
const ageGroupController = require("../controllers/ageGroup.controller");
const { verifyToken } = require("../middleware/Authentication");
const {
  canCreateAgeGroup,
  canReadAgeGroup,
  canUpdateAgeGroup,
  canDeleteAgeGroup
} = require("../middleware/rolePermissions");

// Mobile endpoint (public)
router.get("/mobile", ageGroupController.getAgeGroupsForMobile);

// Protected routes
router.use(verifyToken);
router.post("/", canCreateAgeGroup, ageGroupController.createAgeGroup);
router.get("/", canReadAgeGroup, ageGroupController.getAllAgeGroups);
router.get("/deleted", verifyToken, canReadAgeGroup, ageGroupController.getDeleted);
router.get("/:id", canReadAgeGroup, ageGroupController.getById);
router.put("/:id", canUpdateAgeGroup, ageGroupController.update);
router.delete('/:id', verifyToken, canDeleteAgeGroup, ageGroupController.delete);
router.patch('/restore/:id', verifyToken, canUpdateAgeGroup, ageGroupController.restore);

module.exports = router;
