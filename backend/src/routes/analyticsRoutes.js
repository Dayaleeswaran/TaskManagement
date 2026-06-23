const express = require("express");
const router = express.Router();
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const { getDashboardAnalytics } = require("../controllers/analyticsController");

router.use(verifyToken);
router.use(checkPasswordReset);

router.get("/dashboard", getDashboardAnalytics);

module.exports = router;
