const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const {
  uploadAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
} = require("../controllers/attachment.controller");

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB size limit
  },
});

// Protect all attachment endpoints
router.use(verifyToken);
router.use(checkPasswordReset);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload file attachment to a task
 *     description: Uploads a task file (PDF, DOCX, XLSX, TXT, images, ZIP) to Supabase Storage and records metadata. Max 20MB.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the task
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation failed (file size, mime type, etc.)
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post("/tasks/:taskId/attachments", upload.single("file"), uploadAttachment);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/attachments:
 *   get:
 *     summary: List all attachments for a task
 *     description: Retrieves the metadata entries of all uploaded files associated with the target task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: Returns list of attachment objects
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/tasks/:taskId/attachments", getAttachments);

/**
 * @swagger
 * /api/v1/attachments/{id}/download:
 *   get:
 *     summary: Download a task attachment
 *     description: Generates a temporary signed URL (valid for 5 minutes) and redirects the client to download the resource securely.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the attachment
 *     responses:
 *       302:
 *         description: Redirects to the secure signed URL
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attachment not found
 *       500:
 *         description: Server error
 */
router.get("/attachments/:id/download", downloadAttachment);

/**
 * @swagger
 * /api/v1/attachments/{id}:
 *   delete:
 *     summary: Delete a task attachment
 *     description: Removes the file from Supabase Storage and deletes the metadata records from PostgreSQL.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the attachment to remove
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       403:
 *         description: Forbidden (only uploader, project owner, or admins can delete)
 *       404:
 *         description: Attachment not found
 *       500:
 *         description: Server error
 */
router.delete("/attachments/:id", deleteAttachment);

module.exports = router;
