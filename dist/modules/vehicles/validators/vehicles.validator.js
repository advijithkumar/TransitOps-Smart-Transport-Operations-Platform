"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createVehicleSchema = zod_1.z.object({
    body: zod_1.z.object({
        registrationNumber: zod_1.z.string().min(2, "Registration number must be at least 2 characters long"),
        name: zod_1.z.string().min(2, "Vehicle name is required"),
        model: zod_1.z.string().min(2, "Vehicle model is required"),
        typeId: zod_1.z.string().uuid("Type ID must be a valid UUID"),
        maxCapacity: zod_1.z.number().positive("Maximum load capacity must be positive (kg)"),
        odometer: zod_1.z.number().nonnegative("Odometer reading cannot be negative"),
        acquisitionCost: zod_1.z.number().nonnegative("Acquisition cost cannot be negative"),
        status: zod_1.z.nativeEnum(client_1.VehicleStatus).default(client_1.VehicleStatus.AVAILABLE),
        regionId: zod_1.z.string().uuid("Region ID must be a valid UUID").optional(),
    }),
});
exports.updateVehicleSchema = zod_1.z.object({
    body: zod_1.z.object({
        registrationNumber: zod_1.z.string().min(2).optional(),
        name: zod_1.z.string().min(2).optional(),
        model: zod_1.z.string().min(2).optional(),
        typeId: zod_1.z.string().uuid().optional(),
        maxCapacity: zod_1.z.number().positive().optional(),
        odometer: zod_1.z.number().nonnegative().optional(),
        acquisitionCost: zod_1.z.number().nonnegative().optional(),
        status: zod_1.z.nativeEnum(client_1.VehicleStatus).optional(),
        regionId: zod_1.z.string().uuid().optional(),
    }),
});
