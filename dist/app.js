"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("./config/redis");
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = require("./config/logger");
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Route Imports
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const vehicles_routes_1 = __importDefault(require("./modules/vehicles/vehicles.routes"));
const drivers_routes_1 = __importDefault(require("./modules/drivers/drivers.routes"));
const trips_routes_1 = __importDefault(require("./modules/trips/trips.routes"));
const maintenance_routes_1 = __importDefault(require("./modules/maintenance/maintenance.routes"));
const fuel_routes_1 = __importDefault(require("./modules/fuel/fuel.routes"));
const expenses_routes_1 = __importDefault(require("./modules/expenses/expenses.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const app = (0, express_1.default)();
// ─── Security Middleware ──────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    store: (0, rate_limit_redis_1.createClient)({ sendCommand: (...args) => redis_1.redis.call(...args) }),
    message: { success: false, message: "Too many requests, please try again later." },
});
app.use(rateLimiter);
// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// ─── Request Logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    next();
});
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
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
            description: "Production-ready REST API for TransitOps Smart Transport Operations Platform. Built with Node.js, TypeScript, PostgreSQL + PostGIS, Redis, BullMQ, Socket.IO, and MQTT.",
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { background-color: #1E3A5F; }",
    customSiteTitle: "TransitOps API Docs",
}));
// Raw OpenAPI spec endpoint
app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
});
// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = "/api";
app.use(`${API_PREFIX}/auth`, auth_routes_1.default);
app.use(`${API_PREFIX}/vehicles`, vehicles_routes_1.default);
app.use(`${API_PREFIX}/drivers`, drivers_routes_1.default);
app.use(`${API_PREFIX}/trips`, trips_routes_1.default);
app.use(`${API_PREFIX}/maintenance`, maintenance_routes_1.default);
app.use(`${API_PREFIX}/fuel`, fuel_routes_1.default);
app.use(`${API_PREFIX}/expenses`, expenses_routes_1.default);
app.use(`${API_PREFIX}/dashboard`, dashboard_routes_1.default);
app.use(`${API_PREFIX}/analytics`, analytics_routes_1.default);
app.use(`${API_PREFIX}/reports`, reports_routes_1.default);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "The requested endpoint does not exist.",
    });
});
// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(error_middleware_1.errorHandler);
exports.default = app;
