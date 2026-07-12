import { z } from "zod";
import { MaintenanceType, MaintenanceStatus } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("Vehicle ID must be a valid UUID"),
    type: z.nativeEnum(MaintenanceType, { errorMap: () => ({ message: "Invalid maintenance type" }) }),
    cost: z.number().nonnegative("Cost cannot be negative"),
    vendor: z.string().min(2, "Vendor name is required"),
    date: z.string().datetime("Date must be a valid ISO Date string"),
    description: z.string().optional(),
    status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.SCHEDULED),
  }),
});

export const updateMaintenanceSchema = z.object({
  body: z.object({
    type: z.nativeEnum(MaintenanceType).optional(),
    cost: z.number().nonnegative().optional(),
    vendor: z.string().min(2).optional(),
    date: z.string().datetime().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(MaintenanceStatus).optional(),
  }),
});
