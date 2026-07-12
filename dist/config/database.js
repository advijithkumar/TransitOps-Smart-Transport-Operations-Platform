"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.prisma = new client_1.PrismaClient({
    log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
    ],
});
// @ts-ignore
exports.prisma.$on("query", (e) => {
    logger_1.logger.debug(`Prisma Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});
const connectDb = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info("Successfully connected to PostgreSQL database.");
    }
    catch (error) {
        logger_1.logger.error("Failed to connect to PostgreSQL database:", error);
        process.exit(1);
    }
};
exports.connectDb = connectDb;
