"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenance_controller_1 = require("./controllers/maintenance.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const maintenance_validator_1 = require("./validators/maintenance.validator");
const router = (0, express_1.Router)();
const controller = new maintenance_controller_1.MaintenanceController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Log a vehicle maintenance entry
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, type, cost, vendor, date]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [OIL_CHANGE, TYRE_CHANGE, BRAKE_REPAIR, ENGINE_SERVICE, OTHER]
 *               cost:
 *                 type: number
 *               vendor:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       201:
 *         description: Maintenance log created
 */
router.post("/", (0, rbac_middleware_1.authorize)("CREATE_MAINTENANCE"), (0, validation_middleware_1.validateRequest)(maintenance_validator_1.createMaintenanceSchema), controller.create);
/**
 * @swagger
 * /maintenance:
 *   get:
 *     summary: Get all maintenance logs
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log list
 */
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_MAINTENANCE"), controller.list);
/**
 * @swagger
 * /maintenance/{id}:
 *   get:
 *     summary: Get maintenance log details
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Log details
 */
router.get("/:id", (0, rbac_middleware_1.authorize)("VIEW_MAINTENANCE"), controller.getById);
/**
 * @swagger
 * /maintenance/{id}:
 *   patch:
 *     summary: Update maintenance log status and details
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *               cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Log updated
 */
router.patch("/:id", (0, rbac_middleware_1.authorize)("UPDATE_MAINTENANCE"), (0, validation_middleware_1.validateRequest)(maintenance_validator_1.updateMaintenanceSchema), controller.update);
/**
 * @swagger
 * /maintenance/{id}:
 *   delete:
 *     summary: Soft-delete maintenance record
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Log deleted
 */
router.delete("/:id", (0, rbac_middleware_1.authorize)("UPDATE_MAINTENANCE"), controller.delete);
exports.default = router;
