"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFuelSchema = exports.createFuelSchema = void 0;
const zod_1 = require("zod");
exports.createFuelSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid("Vehicle ID must be a valid UUID"),
        tripId: zod_1.z.string().uuid("Trip ID must be a valid UUID").optional(),
        quantity: zod_1.z.number().positive("Quantity must be positive (L)"),
        cost: zod_1.z.number().positive("Cost must be positive"),
        station: zod_1.z.string().min(2, "Station name is required"),
        date: zod_1.z.string().datetime("Date must be a valid ISO Date string"),
    }),
});
exports.updateFuelSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid().optional(),
        tripId: zod_1.z.string().uuid().optional(),
        quantity: zod_1.z.number().positive().optional(),
        cost: zod_1.z.number().positive().optional(),
        station: zod_1.z.string().min(2).optional(),
        date: zod_1.z.string().datetime().optional(),
    }),
});
