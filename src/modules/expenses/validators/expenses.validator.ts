import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

export const createExpenseSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("Vehicle ID must be a valid UUID"),
    tripId: z.string().uuid("Trip ID must be a valid UUID").optional(),
    category: z.nativeEnum(ExpenseCategory, { errorMap: () => ({ message: "Invalid expense category" }) }),
    amount: z.number().positive("Amount must be positive"),
    date: z.string().datetime("Date must be a valid ISO Date string"),
    description: z.string().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    amount: z.number().positive().optional(),
    date: z.string().datetime().optional(),
    description: z.string().optional(),
  }),
});
