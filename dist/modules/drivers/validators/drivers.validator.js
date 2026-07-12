"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDriverSchema = exports.createDriverSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createDriverSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, "Driver name must be at least 2 characters long"),
        licenseNumber: zod_1.z.string().min(5, "License number must be at least 5 characters long"),
        licenseCategory: zod_1.z.string().min(1, "License category is required (e.g. Class A CDL)"),
        licenseExpiry: zod_1.z.string().datetime("License expiry must be a valid ISO Date string (e.g. YYYY-MM-DDTHH:MM:SSZ)"),
        contactNumber: zod_1.z.string().min(5, "Contact number is required"),
        safetyScore: zod_1.z.number().min(0).max(100).default(100.0),
        status: zod_1.z.nativeEnum(client_1.DriverStatus).default(client_1.DriverStatus.AVAILABLE),
        userId: zod_1.z.string().uuid("User ID must be a valid UUID").optional(),
    }),
});
exports.updateDriverSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        licenseNumber: zod_1.z.string().min(5).optional(),
        licenseCategory: zod_1.z.string().min(1).optional(),
        licenseExpiry: zod_1.z.string().datetime().optional(),
        contactNumber: zod_1.z.string().min(5).optional(),
        safetyScore: zod_1.z.number().min(0).max(100).optional(),
        status: zod_1.z.nativeEnum(client_1.DriverStatus).optional(),
        userId: zod_1.z.string().uuid().optional(),
    }),
});
