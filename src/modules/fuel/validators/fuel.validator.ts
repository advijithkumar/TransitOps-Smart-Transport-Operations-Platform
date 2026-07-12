import { z } from "zod";

export const createFuelSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("Vehicle ID must be a valid UUID"),
    tripId: z.string().uuid("Trip ID must be a valid UUID").optional(),
    quantity: z.number().positive("Quantity must be positive (L)"),
    cost: z.number().positive("Cost must be positive"),
    station: z.string().min(2, "Station name is required"),
    date: z.string().datetime("Date must be a valid ISO Date string"),
  }),
});

export const updateFuelSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
    quantity: z.number().positive().optional(),
    cost: z.number().positive().optional(),
    station: z.string().min(2).optional(),
    date: z.string().datetime().optional(),
  }),
});
