"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitAlert = exports.emitDashboardUpdate = exports.emitTripStatusChange = exports.emitLiveLocation = exports.getSocketServer = exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../shared/utils/jwt");
const logger_1 = require("../config/logger");
let io;
const initSocketServer = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
    });
    // JWT Authentication middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return next(new Error("Socket authentication error: Token missing"));
        }
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            socket.user = decoded;
            next();
        }
        catch {
            next(new Error("Socket authentication error: Invalid or expired token"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.user;
        logger_1.logger.info(`Socket connected: ${socket.id} | User: ${user.email} | Role: ${user.role}`);
        // Join role-based rooms
        socket.join(`role:${user.role}`);
        socket.join(`user:${user.userId}`);
        // Fleet managers and admins get fleet-wide updates
        if (["ADMIN", "FLEET_MANAGER", "DISPATCHER"].includes(user.role)) {
            socket.join("fleet-operations");
        }
        socket.on("disconnect", () => {
            logger_1.logger.info(`Socket disconnected: ${socket.id} | User: ${user.email}`);
        });
    });
    logger_1.logger.info("Socket.IO server initialized successfully.");
    return io;
};
exports.initSocketServer = initSocketServer;
const getSocketServer = () => {
    if (!io)
        throw new Error("Socket.IO server not initialized.");
    return io;
};
exports.getSocketServer = getSocketServer;
// Emit helpers
const emitLiveLocation = (deviceId, locationData) => {
    if (!io)
        return;
    io.to("fleet-operations").emit("gps:location-update", { deviceId, ...locationData });
};
exports.emitLiveLocation = emitLiveLocation;
const emitTripStatusChange = (tripId, status, tripData) => {
    if (!io)
        return;
    io.to("fleet-operations").emit("trip:status-change", { tripId, status, ...tripData });
};
exports.emitTripStatusChange = emitTripStatusChange;
const emitDashboardUpdate = (kpis) => {
    if (!io)
        return;
    io.to("fleet-operations").emit("dashboard:kpi-update", kpis);
};
exports.emitDashboardUpdate = emitDashboardUpdate;
const emitAlert = (userId, alert) => {
    if (!io)
        return;
    io.to(`user:${userId}`).emit("system:alert", alert);
};
exports.emitAlert = emitAlert;
