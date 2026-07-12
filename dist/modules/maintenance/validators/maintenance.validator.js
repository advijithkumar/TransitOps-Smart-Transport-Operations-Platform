"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaintenanceSchema = exports.createMaintenanceSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createMaintenanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid("Vehicle ID must be a valid UUID"),
        type: zod_1.z.nativeEnum(client_1.MaintenanceType, { errorMap: () => ({ message: "Invalid maintenance type" }) }),
        cost: zod_1.z.number().nonnegative("Cost cannot be negative"),
        vendor: zod_1.z.string().min(2, "Vendor name is required"),
        date: zod_1.z.string().datetime("Date must be a valid ISO Date string"),
        description: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(client_1.MaintenanceStatus).default(client_1.MaintenanceStatus.SCHEDULED),
    }),
});
exports.updateMaintenanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.nativeEnum(client_1.MaintenanceType).optional(),
        cost: zod_1.z.number().nonnegative().optional(),
        vendor: zod_1.z.string().min(2).optional(),
        date: zod_1.z.string().datetime().optional(),
        description: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(client_1.MaintenanceStatus).optional(),
    }),
});
