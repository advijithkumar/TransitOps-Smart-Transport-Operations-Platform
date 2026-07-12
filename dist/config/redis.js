"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheDel = exports.cacheGet = exports.cacheSet = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
exports.redis = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
});
exports.redis.on("connect", () => {
    logger_1.logger.info("Connected to Redis successfully.");
});
exports.redis.on("error", (err) => {
    logger_1.logger.error("Redis Connection Error:", err);
});
// Cache Helpers
const cacheSet = async (key, value, ttlSeconds) => {
    try {
        const stringifiedValue = JSON.stringify(value);
        if (ttlSeconds) {
            await exports.redis.set(key, stringifiedValue, "EX", ttlSeconds);
        }
        else {
            await exports.redis.set(key, stringifiedValue);
        }
    }
    catch (error) {
        logger_1.logger.error(`Error setting cache key "${key}":`, error);
    }
};
exports.cacheSet = cacheSet;
const cacheGet = async (key) => {
    try {
        const data = await exports.redis.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    catch (error) {
        logger_1.logger.error(`Error getting cache key "${key}":`, error);
        return null;
    }
};
exports.cacheGet = cacheGet;
const cacheDel = async (key) => {
    try {
        await exports.redis.del(key);
    }
    catch (error) {
        logger_1.logger.error(`Error deleting cache key "${key}":`, error);
    }
};
exports.cacheDel = cacheDel;
