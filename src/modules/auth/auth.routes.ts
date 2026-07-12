import { Router } from "express";
import { AuthController } from "./controllers/auth.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./validators/auth.validator";

const router = Router();
const controller = new AuthController();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 example: manager@transitops.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               name:
 *                 type: string
 *                 example: John Manager
 *               phone:
 *                 type: string
 *                 example: "+15550299"
 *               roleName:
 *                 type: string
 *                 example: FLEET_MANAGER
 *     responses:
 *       201:
 *         description: Registered successfully
 */
router.post("/register", validateRequest(registerSchema), controller.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and generate access/refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@transitops.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", validateRequest(loginSchema), controller.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT Access Token using Refresh Token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post("/refresh", controller.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke session and blacklist current JWT Access Token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authenticate as any, controller.logout as any);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Queue request to send a password reset code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@transitops.com
 *     responses:
 *       200:
 *         description: Email queued
 */
router.post("/forgot-password", validateRequest(forgotPasswordSchema), controller.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with validation token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: NewSecret123
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post("/reset-password", validateRequest(resetPasswordSchema), controller.resetPassword);

export default router;
