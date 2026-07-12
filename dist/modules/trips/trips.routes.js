"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trips_controller_1 = require("./controllers/trips.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const trips_validator_1 = require("./validators/trips.validator");
const router = (0, express_1.Router)();
const controller = new trips_controller_1.TripsController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Create a trip draft
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId, source, destination, cargoWeight, plannedDistance]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *               driverId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *               source:
 *                 type: string
 *                 example: New York Depot A
 *               destination:
 *                 type: string
 *                 example: Philadelphia Warehouse 4
 *               cargoWeight:
 *                 type: number
 *                 example: 12000
 *               plannedDistance:
 *                 type: number
 *                 example: 156.4
 *     responses:
 *       201:
 *         description: Trip draft created
 */
router.post("/", (0, rbac_middleware_1.authorize)("CREATE_TRIP"), (0, validation_middleware_1.validateRequest)(trips_validator_1.createTripSchema), controller.create);
/**
 * @swagger
 * /trips:
 *   get:
 *     summary: List all trips
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, DISPATCHED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip list
 */
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_TRIP"), controller.list);
/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Get trip details by ID
 *     tags: [Trips]
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
 *         description: Trip details
 */
router.get("/:id", (0, rbac_middleware_1.authorize)("VIEW_TRIP"), controller.getById);
/**
 * @swagger
 * /trips/{id}/dispatch:
 *   post:
 *     summary: Dispatch a trip, shifting vehicle and driver to ON_TRIP status
 *     tags: [Trips]
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
 *         description: Trip dispatched
 */
router.post("/:id/dispatch", (0, rbac_middleware_1.authorize)("DISPATCH_TRIP"), controller.dispatch);
/**
 * @swagger
 * /trips/{id}/complete:
 *   post:
 *     summary: Mark trip completed, releasing vehicle and driver, updating odometer, and calculating logs
 *     tags: [Trips]
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
 *             required: [actualDistance, revenue, fuelUsed, finalOdometer]
 *             properties:
 *               actualDistance:
 *                 type: number
 *                 example: 158.2
 *               revenue:
 *                 type: number
 *                 example: 1250
 *               fuelUsed:
 *                 type: number
 *                 example: 48.5
 *               finalOdometer:
 *                 type: number
 *                 example: 12158.2
 *     responses:
 *       200:
 *         description: Trip completed
 */
router.post("/:id/complete", (0, rbac_middleware_1.authorize)("COMPLETE_TRIP"), (0, validation_middleware_1.validateRequest)(trips_validator_1.completeTripSchema), controller.complete);
/**
 * @swagger
 * /trips/{id}/cancel:
 *   post:
 *     summary: Cancel a trip and release driver and vehicle
 *     tags: [Trips]
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
 *         description: Trip cancelled
 */
router.post("/:id/cancel", (0, rbac_middleware_1.authorize)("CANCEL_TRIP"), controller.cancel);
/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     summary: Soft-delete a trip record
 *     tags: [Trips]
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
 *         description: Trip deleted
 */
router.delete("/:id", (0, rbac_middleware_1.authorize)("DELETE_TRIP"), controller.delete);
exports.default = router;
