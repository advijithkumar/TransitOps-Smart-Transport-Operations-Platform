"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    authService = new auth_service_1.AuthService();
    register = async (req, res, next) => {
        try {
            const user = await this.authService.register(req.body);
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const result = await this.authService.login(req.body);
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: "Refresh token is required",
                });
                return;
            }
            const tokens = await this.authService.refreshToken(refreshToken);
            res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                data: tokens,
            });
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const token = req.token;
            const userId = req.user.userId;
            await this.authService.logout(token, userId);
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            await this.authService.forgotPassword(req.body.email);
            res.status(200).json({
                success: true,
                message: "If email exists, a password reset link has been sent.",
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            await this.authService.resetPassword(req.body);
            res.status(200).json({
                success: true,
                message: "Password reset successful. Please login with your new credentials.",
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
