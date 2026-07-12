import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyAccessToken } from "../shared/utils/jwt";
import { logger } from "../config/logger";

let io: SocketIOServer;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return next(new Error("Socket authentication error: Token missing"));
    }
    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Socket authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${socket.id} | User: ${user.email} | Role: ${user.role}`);

    // Join role-based rooms
    socket.join(`role:${user.role}`);
    socket.join(`user:${user.userId}`);

    // Fleet managers and admins get fleet-wide updates
    if (["ADMIN", "FLEET_MANAGER", "DISPATCHER"].includes(user.role)) {
      socket.join("fleet-operations");
    }

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id} | User: ${user.email}`);
    });
  });

  logger.info("Socket.IO server initialized successfully.");
  return io;
};

export const getSocketServer = (): SocketIOServer => {
  if (!io) throw new Error("Socket.IO server not initialized.");
  return io;
};

// Emit helpers
export const emitLiveLocation = (deviceId: string, locationData: any) => {
  if (!io) return;
  io.to("fleet-operations").emit("gps:location-update", { deviceId, ...locationData });
};

export const emitTripStatusChange = (tripId: string, status: string, tripData: any) => {
  if (!io) return;
  io.to("fleet-operations").emit("trip:status-change", { tripId, status, ...tripData });
};

export const emitDashboardUpdate = (kpis: any) => {
  if (!io) return;
  io.to("fleet-operations").emit("dashboard:kpi-update", kpis);
};

export const emitAlert = (userId: string, alert: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("system:alert", alert);
};
