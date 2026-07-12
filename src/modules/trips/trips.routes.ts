import { Router } from "express";
import { TripsController } from "./controllers/trips.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { createTripSchema, completeTripSchema } from "./validators/trips.validator";

const router = Router();
const controller = new TripsController();

// All routes require authentication
router.use(authenticate as any);

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
router.post("/", authorize("CREATE_TRIP") as any, validateRequest(createTripSchema), controller.create as any);

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
router.get("/", authorize("VIEW_TRIP") as any, controller.list as any);

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
router.get("/:id", authorize("VIEW_TRIP") as any, controller.getById as any);

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
router.post("/:id/dispatch", authorize("DISPATCH_TRIP") as any, controller.dispatch as any);

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
router.post("/:id/complete", authorize("COMPLETE_TRIP") as any, validateRequest(completeTripSchema), controller.complete as any);

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
router.post("/:id/cancel", authorize("CANCEL_TRIP") as any, controller.cancel as any);

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
router.delete("/:id", authorize("DELETE_TRIP") as any, controller.delete as any);

export default router;
