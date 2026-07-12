"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./controllers/analytics.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
const controller = new analytics_controller_1.AnalyticsController();
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /analytics/fleet-utilization:
 *   get:
 *     summary: Get per-vehicle utilization, ROI, fuel efficiency, and profit analytics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Fleet utilization analytics
 */
router.get("/fleet-utilization", (0, rbac_middleware_1.authorize)("VIEW_ANALYTICS"), controller.fleetUtilization);
/**
 * @swagger
 * /analytics/monthly-report:
 *   get:
 *     summary: Get monthly operations report with revenue, costs, and trip statistics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         example: 2026
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         example: 7
 *     responses:
 *       200:
 *         description: Monthly report data
 */
router.get("/monthly-report", (0, rbac_middleware_1.authorize)("VIEW_ANALYTICS"), controller.monthlyReport);
/**
 * @swagger
 * /analytics/driver-performance:
 *   get:
 *     summary: Get driver performance rankings by trips completed, distance, and revenue
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Driver performance data
 */
router.get("/driver-performance", (0, rbac_middleware_1.authorize)("VIEW_ANALYTICS"), controller.driverPerformance);
exports.default = router;
