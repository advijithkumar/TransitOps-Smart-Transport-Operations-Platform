import { z } from "zod";
import { TripStatus } from "@prisma/client";

export const createTripSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("Vehicle ID must be a valid UUID"),
    driverId: z.string().uuid("Driver ID must be a valid UUID"),
    source: z.string().min(2, "Source location is required"),
    destination: z.string().min(2, "Destination location is required"),
    cargoWeight: z.number().positive("Cargo weight must be positive (kg)"),
    plannedDistance: z.number().positive("Planned distance must be positive (km)"),
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    driverId: z.string().uuid().optional(),
    source: z.string().min(2).optional(),
    destination: z.string().min(2).optional(),
    cargoWeight: z.number().positive().optional(),
    plannedDistance: z.number().positive().optional(),
    status: z.nativeEnum(TripStatus).optional(),
  }),
});

export const completeTripSchema = z.object({
  body: z.object({
    actualDistance: z.number().positive("Actual distance must be positive (km)"),
    revenue: z.number().nonnegative("Revenue cannot be negative"),
    fuelUsed: z.number().positive("Fuel used must be positive (L)"),
    finalOdometer: z.number().positive("Final odometer reading must be positive"),
  }),
});
