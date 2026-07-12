"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./controllers/auth.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const auth_validator_1 = require("./validators/auth.validator");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
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
router.post("/register", (0, validation_middleware_1.validateRequest)(auth_validator_1.registerSchema), controller.register);
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
router.post("/login", (0, validation_middleware_1.validateRequest)(auth_validator_1.loginSchema), controller.login);
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
router.post("/logout", auth_middleware_1.authenticate, controller.logout);
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
router.post("/forgot-password", (0, validation_middleware_1.validateRequest)(auth_validator_1.forgotPasswordSchema), controller.forgotPassword);
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
router.post("/reset-password", (0, validation_middleware_1.validateRequest)(auth_validator_1.resetPasswordSchema), controller.resetPassword);
exports.default = router;
