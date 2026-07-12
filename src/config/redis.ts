import Redis from "ioredis";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on("connect", () => {
  logger.info("Connected to Redis successfully.");
});

redis.on("error", (err: Error) => {
  logger.error("Redis Connection Error:", err);
});

// Cache Helpers
export const cacheSet = async (key: string, value: any, ttlSeconds?: number): Promise<void> => {
  try {
    const stringifiedValue = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(key, stringifiedValue, "EX", ttlSeconds);
    } else {
      await redis.set(key, stringifiedValue);
    }
  } catch (error) {
    logger.error(`Error setting cache key "${key}":`, error);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(`Error getting cache key "${key}":`, error);
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`Error deleting cache key "${key}":`, error);
  }
};
