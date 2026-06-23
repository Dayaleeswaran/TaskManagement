const express = require("express");
const router = express.Router();
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectActivities,
} = require("../controllers/projectController");

router.use(verifyToken);
router.use(checkPasswordReset);

router.get("/", getProjects);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/restore", restoreProject);

// Project Members routes
router.get("/:id/members", getProjectMembers);
router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);

// Project Activities timeline route
router.get("/:id/activities", getProjectActivities);

module.exports = router;
