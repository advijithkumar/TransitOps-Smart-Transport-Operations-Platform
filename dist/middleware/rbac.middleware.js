"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const app_error_1 = require("../shared/errors/app-error");
const authorize = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new app_error_1.ForbiddenError("Access denied. User authentication context is missing.");
        }
        // ADMIN role automatically bypasses granular check
        const isCcAdmin = req.user.role.toUpperCase() === "ADMIN";
        const hasPermission = req.user.permissions.includes(requiredPermission);
        if (isCcAdmin || hasPermission) {
            return next();
        }
        throw new app_error_1.ForbiddenError(`Access denied. Insufficient permissions. Required: ${requiredPermission}`);
    };
};
exports.authorize = authorize;
