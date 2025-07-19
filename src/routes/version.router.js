const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/Authentication");
const { addVersion, getAllVersions, getLatestVersion } = require("../controllers/version.controller");

// Protected routes (require authentication)
router.post("/", verifyToken, addVersion);
router.get("/all", verifyToken, getAllVersions);

// Public route for mobile
router.get("/latest", getLatestVersion);

module.exports = router;
