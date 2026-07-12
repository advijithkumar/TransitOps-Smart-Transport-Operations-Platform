"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = exports.reportQueue = exports.maintenanceQueue = exports.licenseQueue = exports.bullMqConnection = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
exports.bullMqConnection = redis_1.redis;
// Initialize background job queues
exports.licenseQueue = new bullmq_1.Queue("license-expiry-check", {
    connection: exports.bullMqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: { age: 86400 }, // Keep logs for 24h
        removeOnFail: { age: 604800 }, // Keep failures for 7 days
    },
});
exports.maintenanceQueue = new bullmq_1.Queue("maintenance-reminder", {
    connection: exports.bullMqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
    },
});
exports.reportQueue = new bullmq_1.Queue("report-generation", {
    connection: exports.bullMqConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: "fixed",
            delay: 10000,
        },
        removeOnComplete: { age: 3600 }, // Keep completed reports config for 1h
        removeOnFail: { age: 86400 },
    },
});
exports.notificationQueue = new bullmq_1.Queue("email-dispatch", {
    connection: exports.bullMqConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
    },
});
