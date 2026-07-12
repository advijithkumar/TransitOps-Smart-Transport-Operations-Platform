"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../shared/utils/jwt");
const app_error_1 = require("../shared/errors/app-error");
const redis_1 = require("../config/redis");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new app_error_1.UnauthorizedError("Authentication token is missing.");
        }
        const token = authHeader.split(" ")[1];
        // Check Redis token blacklist
        const isBlacklisted = await redis_1.redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new app_error_1.UnauthorizedError("Token has been invalidated. Please login again.");
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        req.token = token;
        next();
    }
    catch (error) {
        next(new app_error_1.UnauthorizedError(error.message || "Invalid or expired access token."));
    }
};
exports.authenticate = authenticate;
