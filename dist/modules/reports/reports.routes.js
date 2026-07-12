"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./controllers/reports.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
const controller = new reports_controller_1.ReportsController();
router.use(auth_middleware_1.authenticate);
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
router.get("/fleet-utilization/pdf", (0, rbac_middleware_1.authorize)("VIEW_REPORTS"), controller.fleetUtilizationPDF);
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
router.get("/fleet-utilization/csv", (0, rbac_middleware_1.authorize)("VIEW_REPORTS"), controller.fleetUtilizationCSV);
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
router.get("/fleet-utilization/excel", (0, rbac_middleware_1.authorize)("VIEW_REPORTS"), controller.fleetUtilizationExcel);
exports.default = router;
