import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
  ],
});

// @ts-ignore
prisma.$on("query", (e: any) => {
  logger.debug(`Prisma Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});

export const connectDb = async () => {
  try {
    await prisma.$connect();
    logger.info("Successfully connected to PostgreSQL database.");
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL database:", error);
    process.exit(1);
  }
};
