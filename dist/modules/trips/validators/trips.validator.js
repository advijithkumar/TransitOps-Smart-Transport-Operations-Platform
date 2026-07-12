"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTripSchema = exports.updateTripSchema = exports.createTripSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createTripSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid("Vehicle ID must be a valid UUID"),
        driverId: zod_1.z.string().uuid("Driver ID must be a valid UUID"),
        source: zod_1.z.string().min(2, "Source location is required"),
        destination: zod_1.z.string().min(2, "Destination location is required"),
        cargoWeight: zod_1.z.number().positive("Cargo weight must be positive (kg)"),
        plannedDistance: zod_1.z.number().positive("Planned distance must be positive (km)"),
    }),
});
exports.updateTripSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid().optional(),
        driverId: zod_1.z.string().uuid().optional(),
        source: zod_1.z.string().min(2).optional(),
        destination: zod_1.z.string().min(2).optional(),
        cargoWeight: zod_1.z.number().positive().optional(),
        plannedDistance: zod_1.z.number().positive().optional(),
        status: zod_1.z.nativeEnum(client_1.TripStatus).optional(),
    }),
});
exports.completeTripSchema = zod_1.z.object({
    body: zod_1.z.object({
        actualDistance: zod_1.z.number().positive("Actual distance must be positive (km)"),
        revenue: zod_1.z.number().nonnegative("Revenue cannot be negative"),
        fuelUsed: zod_1.z.number().positive("Fuel used must be positive (L)"),
        finalOdometer: zod_1.z.number().positive("Final odometer reading must be positive"),
    }),
});
