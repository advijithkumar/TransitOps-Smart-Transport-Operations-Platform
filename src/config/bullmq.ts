import { Queue } from "bullmq";
import { redis } from "./redis";

export const bullMqConnection = redis;

// Initialize background job queues
export const licenseQueue = new Queue("license-expiry-check", {
  connection: bullMqConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 86400 }, // Keep logs for 24h
    removeOnFail: { age: 604800 },    // Keep failures for 7 days
  },
});

export const maintenanceQueue = new Queue("maintenance-reminder", {
  connection: bullMqConnection as any,
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

export const reportQueue = new Queue("report-generation", {
  connection: bullMqConnection as any,
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

export const notificationQueue = new Queue("email-dispatch", {
  connection: bullMqConnection as any,
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
