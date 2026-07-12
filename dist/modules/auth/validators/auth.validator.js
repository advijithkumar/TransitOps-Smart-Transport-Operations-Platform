"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address format"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
        name: zod_1.z.string().min(2, "Name must be at least 2 characters long"),
        phone: zod_1.z.string().optional(),
        roleName: zod_1.z.string().default("DRIVER"), // Default role
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address format"),
        password: zod_1.z.string().min(1, "Password is required"),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address format"),
    }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, "Reset token is required"),
        newPassword: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    }),
});
