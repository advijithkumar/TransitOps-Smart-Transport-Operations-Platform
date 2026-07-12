import { Router } from "express";
import { DashboardController } from "./controllers/dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";

const router = Router();
const controller = new DashboardController();

router.use(authenticate as any);

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
router.get("/", authorize("VIEW_ANALYTICS") as any, controller.getKPIs as any);

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
router.get("/charts", authorize("VIEW_ANALYTICS") as any, controller.getCharts as any);

export default router;
