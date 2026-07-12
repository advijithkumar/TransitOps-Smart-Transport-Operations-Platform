"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../shared/errors/app-error");
const logger_1 = require("../config/logger");
const zod_1 = require("zod");
const errorHandler = (err, req, res, _next) => {
    // If headers already sent, delegate to default express handler
    if (res.headersSent) {
        return;
    }
    // Handle Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
        logger_1.logger.warn(`Validation failure on ${req.method} ${req.originalUrl}:`, {
            errors: err.errors,
        });
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: err.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
        return;
    }
    // Handle Custom Operational Errors
    if (err instanceof app_error_1.AppError) {
        logger_1.logger.warn(`Operational error: ${err.message} [Code: ${err.statusCode}]`);
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Handle Prisma Specific Known Request Errors
    if (err.constructor.name === "PrismaClientKnownRequestError") {
        const prismaErr = err;
        // P2002: Unique constraint failed
        if (prismaErr.code === "P2002") {
            const target = prismaErr.meta?.target ? prismaErr.meta.target.join(", ") : "field";
            logger_1.logger.warn(`Prisma Unique Constraint Violation on ${target}`);
            res.status(409).json({
                success: false,
                message: `Unique constraint failed. A record with this ${target} already exists.`,
            });
            return;
        }
        // P2025: Record to update/delete not found
        if (prismaErr.code === "P2025") {
            logger_1.logger.warn("Prisma Record Not Found operational error");
            res.status(404).json({
                success: false,
                message: prismaErr.meta?.cause || "Record not found.",
            });
            return;
        }
        // P2003: Foreign key constraint failed
        if (prismaErr.code === "P2003") {
            logger_1.logger.warn(`Prisma Foreign Key Constraint Violation on field ${prismaErr.meta?.field_name}`);
            res.status(400).json({
                success: false,
                message: `Foreign key constraint failed on reference field.`,
            });
            return;
        }
    }
    // Handle Generic Unhandled Errors
    logger_1.logger.error("Unhandled Exception:", err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};
exports.errorHandler = errorHandler;
