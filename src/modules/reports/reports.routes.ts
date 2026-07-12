import { Router } from "express";
import { ReportsController } from "./controllers/reports.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";

const router = Router();
const controller = new ReportsController();

router.use(authenticate as any);

/**
 * @swagger
 * /reports/fleet-utilization/pdf:
 *   get:
 *     summary: Download fleet utilization report as PDF
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/fleet-utilization/pdf", authorize("VIEW_REPORTS") as any, controller.fleetUtilizationPDF as any);

/**
 * @swagger
 * /reports/fleet-utilization/csv:
 *   get:
 *     summary: Download fleet utilization report as CSV
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get("/fleet-utilization/csv", authorize("VIEW_REPORTS") as any, controller.fleetUtilizationCSV as any);

/**
 * @swagger
 * /reports/fleet-utilization/excel:
 *   get:
 *     summary: Download fleet utilization report as Excel (.xlsx)
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/fleet-utilization/excel", authorize("VIEW_REPORTS") as any, controller.fleetUtilizationExcel as any);

export default router;
