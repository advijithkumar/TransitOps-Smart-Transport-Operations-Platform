import { z } from "zod";
import { DriverStatus } from "@prisma/client";

export const createDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Driver name must be at least 2 characters long"),
    licenseNumber: z.string().min(5, "License number must be at least 5 characters long"),
    licenseCategory: z.string().min(1, "License category is required (e.g. Class A CDL)"),
    licenseExpiry: z.string().datetime("License expiry must be a valid ISO Date string (e.g. YYYY-MM-DDTHH:MM:SSZ)"),
    contactNumber: z.string().min(5, "Contact number is required"),
    safetyScore: z.number().min(0).max(100).default(100.0),
    status: z.nativeEnum(DriverStatus).default(DriverStatus.AVAILABLE),
    userId: z.string().uuid("User ID must be a valid UUID").optional(),
  }),
});

export const updateDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    licenseNumber: z.string().min(5).optional(),
    licenseCategory: z.string().min(1).optional(),
    licenseExpiry: z.string().datetime().optional(),
    contactNumber: z.string().min(5).optional(),
    safetyScore: z.number().min(0).max(100).optional(),
    status: z.nativeEnum(DriverStatus).optional(),
    userId: z.string().uuid().optional(),
  }),
});
