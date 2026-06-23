const express = require("express");
const { register, login, logout, forgotPassword, verifyResetCode, resetPassword, changePassword } = require("../controllers/authController");
const { validate } = require("../middleware/validateMiddleware");
const { registerSchema, loginSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema } = require("../validators/authSchemas");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and return a JWT access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserSchema'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       500:
 *         description: Internal Server Error
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PROJECT_MANAGER, COLLABORATOR]
 *                 default: COLLABORATOR
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid data or user already exists
 *       500:
 *         description: Server error
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Terminate the user session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/logout", verifyToken, logout);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-code", validate(verifyResetCodeSchema), verifyResetCode);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;