"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
const bcrypt_1 = require("../../../shared/utils/bcrypt");
const jwt_1 = require("../../../shared/utils/jwt");
const app_error_1 = require("../../../shared/errors/app-error");
const redis_1 = require("../../../config/redis");
const bullmq_1 = require("../../../config/bullmq");
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../../config/logger");
const database_1 = require("../../../config/database");
class AuthService {
    authRepository = new auth_repository_1.AuthRepository();
    async register(data) {
        const existingUser = await this.authRepository.findByEmail(data.email);
        if (existingUser) {
            throw new app_error_1.ConflictError("Email address is already in use");
        }
        const role = await this.authRepository.findRoleByName(data.roleName);
        if (!role) {
            throw new app_error_1.BadRequestError(`Requested role '${data.roleName}' does not exist`);
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(data.password);
        const user = await this.authRepository.createUser({
            email: data.email,
            password: hashedPassword,
            name: data.name,
            phone: data.phone,
            roleId: role.id,
        });
        logger_1.logger.info(`User registered successfully: ${user.email}`);
        // Audit Log entry
        await database_1.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "USER_REGISTER",
                entity: "USER",
                entityId: user.id,
                details: { email: user.email, role: data.roleName },
            },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: data.roleName,
        };
    }
    async login(credentials) {
        const user = await this.authRepository.findByEmail(credentials.email);
        if (!user) {
            throw new app_error_1.UnauthorizedError("Invalid email or password");
        }
        const isPasswordValid = await (0, bcrypt_1.comparePassword)(credentials.password, user.password);
        if (!isPasswordValid) {
            throw new app_error_1.UnauthorizedError("Invalid email or password");
        }
        // Extract permissions
        const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role.name,
            permissions,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        // Save refresh token to user
        await this.authRepository.updateUser(user.id, { refreshToken });
        // Audit Log entry
        await database_1.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "USER_LOGIN",
                entity: "USER",
                entityId: user.id,
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.name,
                permissions,
            },
        };
    }
    async refreshToken(token) {
        try {
            const decoded = (0, jwt_1.verifyRefreshToken)(token);
            const user = await this.authRepository.findById(decoded.userId);
            if (!user || user.refreshToken !== token) {
                throw new app_error_1.UnauthorizedError("Invalid or expired refresh token");
            }
            const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role.name,
                permissions,
            };
            const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
            const newRefreshToken = (0, jwt_1.generateRefreshToken)(user.id);
            await this.authRepository.updateUser(user.id, { refreshToken: newRefreshToken });
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            throw new app_error_1.UnauthorizedError("Invalid refresh token signature");
        }
    }
    async logout(token, userId) {
        // Add access token to Redis blacklist (expire in 15 mins)
        await redis_1.redis.set(`blacklist:${token}`, "true", "EX", 900);
        // Clear user refresh token
        await this.authRepository.updateUser(userId, { refreshToken: null });
        // Audit Log entry
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "USER_LOGOUT",
                entity: "USER",
                entityId: userId,
            },
        });
    }
    async forgotPassword(email) {
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            // Return success silently for security
            logger_1.logger.info(`Forgot password request for non-existent email: ${email}`);
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        // Store reset token in redis for 1 hour
        await redis_1.redis.set(`reset:${resetToken}`, user.id, "EX", 3600);
        // Queue email dispatch job
        await bullmq_1.notificationQueue.add("send-email", {
            to: user.email,
            subject: "TransitOps Password Reset Request",
            html: `
        <h3>Hello ${user.name},</h3>
        <p>You requested a password reset on TransitOps.</p>
        <p>Use the following token to reset your password within the next hour:</p>
        <strong>${resetToken}</strong>
        <p>If you did not request this reset, please ignore this email.</p>
      `,
        });
        logger_1.logger.info(`Forgot password reset queued for user: ${email}`);
    }
    async resetPassword(data) {
        const userId = await redis_1.redis.get(`reset:${data.token}`);
        if (!userId) {
            throw new app_error_1.BadRequestError("Password reset token is invalid or expired");
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(data.newPassword);
        await this.authRepository.updateUser(userId, {
            password: hashedPassword,
            refreshToken: null, // Revoke all sessions on password change
        });
        // Delete token from Redis
        await redis_1.redis.del(`reset:${data.token}`);
        logger_1.logger.info(`Password successfully reset for user id: ${userId}`);
        // Audit Log entry
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "USER_PASSWORD_RESET",
                entity: "USER",
                entityId: userId,
            },
        });
    }
}
exports.AuthService = AuthService;
