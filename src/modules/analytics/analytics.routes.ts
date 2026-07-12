import { Router } from "express";
import { AnalyticsController } from "./controllers/analytics.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate as any);

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
router.get("/fleet-utilization", authorize("VIEW_ANALYTICS") as any, controller.fleetUtilization as any);

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
router.get("/monthly-report", authorize("VIEW_ANALYTICS") as any, controller.monthlyReport as any);

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
router.get("/driver-performance", authorize("VIEW_ANALYTICS") as any, controller.driverPerformance as any);

export default router;
