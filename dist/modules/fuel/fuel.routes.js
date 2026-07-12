"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fuel_controller_1 = require("./controllers/fuel.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const fuel_validator_1 = require("./validators/fuel.validator");
const router = (0, express_1.Router)();
const controller = new fuel_controller_1.FuelController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /fuel:
 *   post:
 *     summary: Log a vehicle refuel entry
 *     tags: [Fuel Logs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, quantity, cost, station, date]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               tripId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *               cost:
 *                 type: number
 *               station:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Fuel log recorded
 */
router.post("/", (0, rbac_middleware_1.authorize)("CREATE_FUEL"), (0, validation_middleware_1.validateRequest)(fuel_validator_1.createFuelSchema), controller.create);
/**
 * @swagger
 * /fuel:
 *   get:
 *     summary: List all fuel logs
 *     tags: [Fuel Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tripId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fuel logs list
 */
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_FUEL"), controller.list);
/**
 * @swagger
 * /fuel/{id}:
 *   get:
 *     summary: Get fuel log details
 *     tags: [Fuel Logs]
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
 *         description: Fuel log details
 */
router.get("/:id", (0, rbac_middleware_1.authorize)("VIEW_FUEL"), controller.getById);
/**
 * @swagger
 * /fuel/{id}:
 *   patch:
 *     summary: Update fuel log
 *     tags: [Fuel Logs]
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
 *               quantity:
 *                 type: number
 *               cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Fuel log updated
 */
router.patch("/:id", (0, rbac_middleware_1.authorize)("CREATE_FUEL"), (0, validation_middleware_1.validateRequest)(fuel_validator_1.updateFuelSchema), controller.update);
/**
 * @swagger
 * /fuel/{id}:
 *   delete:
 *     summary: Soft-delete fuel log
 *     tags: [Fuel Logs]
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
 *         description: Fuel log deleted
 */
router.delete("/:id", (0, rbac_middleware_1.authorize)("CREATE_FUEL"), controller.delete);
/**
 * @swagger
 * /fuel/vehicle/{vehicleId}/metrics:
 *   get:
 *     summary: Calculate fuel efficiency and cost-per-km metrics for a vehicle
 *     tags: [Fuel Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Calculated fuel metrics
 */
router.get("/vehicle/:vehicleId/metrics", (0, rbac_middleware_1.authorize)("VIEW_FUEL"), controller.getMetrics);
exports.default = router;
