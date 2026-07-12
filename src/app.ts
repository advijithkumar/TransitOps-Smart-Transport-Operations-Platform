import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./config/redis";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./config/logger";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Route Imports
import authRoutes from "./modules/auth/auth.routes";
import vehicleRoutes from "./modules/vehicles/vehicles.routes";
import driverRoutes from "./modules/drivers/drivers.routes";
import tripRoutes from "./modules/trips/trips.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";
import fuelRoutes from "./modules/fuel/fuel.routes";
import expenseRoutes from "./modules/expenses/expenses.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import reportsRoutes from "./modules/reports/reports.routes";

const app: Application = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      return redis.call(args[0], ...args.slice(1)) as any;
    },
  }),
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(rateLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request Logger ────────────────────────────────────────────────────────────

app.use((req: Request, _res: Response, next: any) => {
  logger.info(`${req.method} ${req.originalUrl} | IP: ${req.ip}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "TransitOps Enterprise Backend",
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger / OpenAPI Documentation ─────────────────────────────────────────

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TransitOps Enterprise API",
      version: "1.0.0",
      description:
        "Production-ready REST API for TransitOps Smart Transport Operations Platform. Built with Node.js, TypeScript, PostgreSQL + PostGIS, Redis, BullMQ, Socket.IO, and MQTT.",
      contact: {
        name: "TransitOps Engineering",
        email: "engineering@transitops.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token obtained from POST /auth/login",
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.routes.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { background-color: #1E3A5F; }",
  customSiteTitle: "TransitOps API Docs",
}));

// Raw OpenAPI spec endpoint
app.get("/api-docs.json", (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────────────────────

const API_PREFIX = "/api";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
app.use(`${API_PREFIX}/drivers`, driverRoutes);
app.use(`${API_PREFIX}/trips`, tripRoutes);
app.use(`${API_PREFIX}/maintenance`, maintenanceRoutes);
app.use(`${API_PREFIX}/fuel`, fuelRoutes);
app.use(`${API_PREFIX}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "The requested endpoint does not exist.",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler as any);

export default app;
