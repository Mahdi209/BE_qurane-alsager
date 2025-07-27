const express = require("express");
const router = express.Router();
const questionsController = require("../controllers/questions.controller");
const { verifyToken,isSupervisor } = require("../middleware/Authentication");
const {
  canCreateQuestion,
  canReadQuestion,
  canUpdateQuestion,
  canDeleteQuestion
} = require("../middleware/rolePermissions");

router.post("/", verifyToken, canCreateQuestion, questionsController.createQuestion);

router.get("/", questionsController.getAllQuestionsForMobile);
router.get("/AllAgeGroup", questionsController.getAllQuestionsForAllAgeGroup);


router.get("/Platform", questionsController.getAllQuestionsForMobilePlatform);

router.get("/App", questionsController.getAllQuestionsForMobileApp);

router.get("/dashboard", verifyToken, canReadQuestion, questionsController.getAllQuestionsForDashboard);

router.get("/dashboard/block", verifyToken, canReadQuestion, questionsController.getAllQuestionsForDashboardBlock);

router.get("/deleted", verifyToken, canReadQuestion, questionsController.getDeletedQuestions);

router.get("/:id", verifyToken, canReadQuestion, questionsController.getQuestionById);

router.put("/:id", verifyToken, canUpdateQuestion, questionsController.updateQuestion);

router.patch("/status/:id", verifyToken, canUpdateQuestion, questionsController.updateStatusQuestion);

router.delete("/:id", verifyToken, canDeleteQuestion, questionsController.deleteQuestion);

router.delete("/:id/permanent", verifyToken,isSupervisor, canDeleteQuestion, questionsController.permanentDelete);

router.patch("/restore/:id", verifyToken, canUpdateQuestion, questionsController.restoreQuestion);

module.exports = router;
