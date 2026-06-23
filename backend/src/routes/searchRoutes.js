const express = require("express");
const router = express.Router();
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const { performSearch } = require("../controllers/searchController");

router.use(verifyToken);
router.use(checkPasswordReset);

router.get("/", performSearch);

module.exports = router;
