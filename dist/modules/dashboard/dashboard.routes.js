"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./controllers/dashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
const controller = new dashboard_controller_1.DashboardController();
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get real-time fleet KPI dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: KPI dashboard data including fleet, driver, trip, and financial summaries
 */
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_ANALYTICS"), controller.getKPIs);
/**
 * @swagger
 * /dashboard/charts:
 *   get:
 *     summary: Get chart data for dashboard visualizations (bar, line, pie)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daily trips, monthly fuel/maintenance trends, expense category breakdown
 */
router.get("/charts", (0, rbac_middleware_1.authorize)("VIEW_ANALYTICS"), controller.getCharts);
exports.default = router;
