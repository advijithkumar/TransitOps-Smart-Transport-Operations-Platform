import { AuthRepository } from "../repositories/auth.repository";
import { hashPassword, comparePassword } from "../../../shared/utils/bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  UserTokenPayload,
} from "../../../shared/utils/jwt";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../../shared/errors/app-error";
import { redis } from "../../../config/redis";
import { notificationQueue } from "../../../config/bullmq";
import crypto from "crypto";
import { logger } from "../../../config/logger";
import { prisma } from "../../../config/database";

export class AuthService {
  private authRepository = new AuthRepository();

  async register(data: any): Promise<any> {
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("Email address is already in use");
    }

    const role = await this.authRepository.findRoleByName(data.roleName);
    if (!role) {
      throw new BadRequestError(`Requested role '${data.roleName}' does not exist`);
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await this.authRepository.createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      roleId: role.id,
    });

    logger.info(`User registered successfully: ${user.email}`);

    // Audit Log entry
    await prisma.auditLog.create({
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

  async login(credentials: any): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.authRepository.findByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Extract permissions
    const permissions = user.role.rolePermissions.map((rp: any) => rp.permission.name);

    const tokenPayload: UserTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to user
    await this.authRepository.updateUser(user.id, { refreshToken });

    // Audit Log entry
    await prisma.auditLog.create({
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

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await this.authRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedError("Invalid or expired refresh token");
      }

      const permissions = user.role.rolePermissions.map((rp: any) => rp.permission.name);
      const tokenPayload: UserTokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        permissions,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(user.id);

      await this.authRepository.updateUser(user.id, { refreshToken: newRefreshToken });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token signature");
    }
  }

  async logout(token: string, userId: string): Promise<void> {
    // Add access token to Redis blacklist (expire in 15 mins)
    await redis.set(`blacklist:${token}`, "true", "EX", 900);

    // Clear user refresh token
    await this.authRepository.updateUser(userId, { refreshToken: null });

    // Audit Log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: "USER_LOGOUT",
        entity: "USER",
        entityId: userId,
      },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      // Return success silently for security
      logger.info(`Forgot password request for non-existent email: ${email}`);
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    // Store reset token in redis for 1 hour
    await redis.set(`reset:${resetToken}`, user.id, "EX", 3600);

    // Queue email dispatch job
    await notificationQueue.add("send-email", {
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

    logger.info(`Forgot password reset queued for user: ${email}`);
  }

  async resetPassword(data: any): Promise<void> {
    const userId = await redis.get(`reset:${data.token}`);
    if (!userId) {
      throw new BadRequestError("Password reset token is invalid or expired");
    }

    const hashedPassword = await hashPassword(data.newPassword);
    await this.authRepository.updateUser(userId, {
      password: hashedPassword,
      refreshToken: null, // Revoke all sessions on password change
    });

    // Delete token from Redis
    await redis.del(`reset:${data.token}`);

    logger.info(`Password successfully reset for user id: ${userId}`);

    // Audit Log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: "USER_PASSWORD_RESET",
        entity: "USER",
        entityId: userId,
      },
    });
  }
}
