"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid("Vehicle ID must be a valid UUID"),
        tripId: zod_1.z.string().uuid("Trip ID must be a valid UUID").optional(),
        category: zod_1.z.nativeEnum(client_1.ExpenseCategory, { errorMap: () => ({ message: "Invalid expense category" }) }),
        amount: zod_1.z.number().positive("Amount must be positive"),
        date: zod_1.z.string().datetime("Date must be a valid ISO Date string"),
        description: zod_1.z.string().optional(),
    }),
});
exports.updateExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid().optional(),
        tripId: zod_1.z.string().uuid().optional(),
        category: zod_1.z.nativeEnum(client_1.ExpenseCategory).optional(),
        amount: zod_1.z.number().positive().optional(),
        date: zod_1.z.string().datetime().optional(),
        description: zod_1.z.string().optional(),
    }),
});
