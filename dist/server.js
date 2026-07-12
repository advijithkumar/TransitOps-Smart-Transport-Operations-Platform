"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const socket_server_1 = require("./socket/socket.server");
const mqtt_subscriber_1 = require("./mqtt/mqtt.subscriber");
const bullmq_worker_1 = require("./queue/bullmq.worker");
const logger_1 = require("./config/logger");
const PORT = process.env.PORT || 3000;
const bootstrap = async () => {
    try {
        // 1. Connect to PostgreSQL database
        await (0, database_1.connectDb)();
        // 2. Verify Redis connection
        await redis_1.redis.ping();
        logger_1.logger.info("Redis connection verified.");
        // 3. Create HTTP server wrapping Express app
        const httpServer = http_1.default.createServer(app_1.default);
        // 4. Initialize Socket.IO on the HTTP server
        (0, socket_server_1.initSocketServer)(httpServer);
        // 5. Initialize MQTT message handler (after socket.io is ready)
        (0, mqtt_subscriber_1.initMqttSubscriber)();
        // 6. Initialize BullMQ workers
        (0, bullmq_worker_1.initWorkers)();
        // 7. Start listening
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`
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
        const shutdown = async (signal) => {
            logger_1.logger.warn(`Received ${signal}. Shutting down gracefully...`);
            httpServer.close(async () => {
                await redis_1.redis.quit();
                logger_1.logger.info("Redis connection closed.");
                process.exit(0);
            });
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("uncaughtException", (err) => {
            logger_1.logger.error("Uncaught Exception:", err);
            process.exit(1);
        });
        process.on("unhandledRejection", (reason) => {
            logger_1.logger.error("Unhandled Rejection:", reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to bootstrap TransitOps server:", error);
        process.exit(1);
    }
};
bootstrap();
