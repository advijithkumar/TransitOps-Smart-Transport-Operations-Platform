import { z } from "zod";
import { VehicleStatus } from "@prisma/client";

export const createVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(2, "Registration number must be at least 2 characters long"),
    name: z.string().min(2, "Vehicle name is required"),
    model: z.string().min(2, "Vehicle model is required"),
    typeId: z.string().uuid("Type ID must be a valid UUID"),
    maxCapacity: z.number().positive("Maximum load capacity must be positive (kg)"),
    odometer: z.number().nonnegative("Odometer reading cannot be negative"),
    acquisitionCost: z.number().nonnegative("Acquisition cost cannot be negative"),
    status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
    regionId: z.string().uuid("Region ID must be a valid UUID").optional(),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    model: z.string().min(2).optional(),
    typeId: z.string().uuid().optional(),
    maxCapacity: z.number().positive().optional(),
    odometer: z.number().nonnegative().optional(),
    acquisitionCost: z.number().nonnegative().optional(),
    status: z.nativeEnum(VehicleStatus).optional(),
    regionId: z.string().uuid().optional(),
  }),
});
