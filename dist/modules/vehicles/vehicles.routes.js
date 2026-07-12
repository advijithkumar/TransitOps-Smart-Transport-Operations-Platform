"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicles_controller_1 = require("./controllers/vehicles.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const vehicles_validator_1 = require("./validators/vehicles.validator");
const router = (0, express_1.Router)();
const controller = new vehicles_controller_1.VehiclesController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Register a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registrationNumber, name, model, typeId, maxCapacity, odometer, acquisitionCost]
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 example: NY-9843-XY
 *               name:
 *                 type: string
 *                 example: Freightliner Cascadia
 *               model:
 *                 type: string
 *                 example: Cascadia 2026
 *               typeId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *               maxCapacity:
 *                 type: number
 *                 example: 18000
 *               odometer:
 *                 type: number
 *                 example: 12000
 *               acquisitionCost:
 *                 type: number
 *                 example: 145000
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ON_TRIP, IN_SHOP, RETIRED]
 *                 example: AVAILABLE
 *               regionId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *     responses:
 *       210:
 *         description: Vehicle registered
 */
router.post("/", (0, rbac_middleware_1.authorize)("CREATE_VEHICLE"), (0, validation_middleware_1.validateRequest)(vehicles_validator_1.createVehicleSchema), controller.create);
/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles in the fleet
 *     tags: [Vehicles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ON_TRIP, IN_SHOP, RETIRED]
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: regionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_VEHICLE"), controller.list);
/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
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
 *         description: Vehicle details
 */
router.get("/:id", (0, rbac_middleware_1.authorize)("VIEW_VEHICLE"), controller.getById);
/**
 * @swagger
 * /vehicles/{id}:
 *   patch:
 *     summary: Update vehicle details
 *     tags: [Vehicles]
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
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ON_TRIP, IN_SHOP, RETIRED]
 *     responses:
 *       200:
 *         description: Vehicle updated
 */
router.patch("/:id", (0, rbac_middleware_1.authorize)("UPDATE_VEHICLE"), (0, validation_middleware_1.validateRequest)(vehicles_validator_1.updateVehicleSchema), controller.update);
/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Soft-delete vehicle from fleet
 *     tags: [Vehicles]
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
 *         description: Vehicle deleted
 */
router.delete("/:id", (0, rbac_middleware_1.authorize)("DELETE_VEHICLE"), controller.delete);
exports.default = router;
