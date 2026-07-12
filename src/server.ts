import "dotenv/config";
import http from "http";
import app from "./app";
import { connectDb } from "./config/database";
import { redis } from "./config/redis";
import { initSocketServer } from "./socket/socket.server";
import { initMqttSubscriber } from "./mqtt/mqtt.subscriber";
import { initWorkers } from "./queue/bullmq.worker";
import { logger } from "./config/logger";

const PORT = process.env.PORT || 3000;

const bootstrap = async (): Promise<void> => {
  try {
    // 1. Connect to PostgreSQL database
    await connectDb();

    // 2. Verify Redis connection
    await redis.ping();
    logger.info("Redis connection verified.");

    // 3. Create HTTP server wrapping Express app
    const httpServer = http.createServer(app);

    // 4. Initialize Socket.IO on the HTTP server
    initSocketServer(httpServer);

    // 5. Initialize MQTT message handler (after socket.io is ready)
    initMqttSubscriber();

    // 6. Initialize BullMQ workers
    initWorkers();

    // 7. Start listening
    httpServer.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════╗
║      TransitOps Enterprise Backend is running       ║
╠══════════════════════════════════════════════════════╣
║  HTTP API   :  http://localhost:${PORT}/api           ║
║  Swagger UI :  http://localhost:${PORT}/api-docs      ║
║  Health     :  http://localhost:${PORT}/health        ║
║  WebSocket  :  ws://localhost:${PORT}                 ║
║  Environment:  ${process.env.NODE_ENV || "development"}             ║
╚══════════════════════════════════════════════════════╝
      `);
    });

    // 8. Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Shutting down gracefully...`);
      httpServer.close(async () => {
        await redis.quit();
        logger.info("Redis connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to bootstrap TransitOps server:", error);
    process.exit(1);
  }
};

bootstrap();
