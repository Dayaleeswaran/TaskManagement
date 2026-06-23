const express = require("express");
const router = express.Router();
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const {
  getNotificationSettings,
  updateNotificationSettings,
} = require("../controllers/settingsController");

router.use(verifyToken);
router.use(checkPasswordReset);

router.get("/notifications", getNotificationSettings);
router.put("/notifications", updateNotificationSettings);

module.exports = router;
