import { Router } from "express";
import { FuelController } from "./controllers/fuel.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { createFuelSchema, updateFuelSchema } from "./validators/fuel.validator";

const router = Router();
const controller = new FuelController();

// All routes require authentication
router.use(authenticate as any);

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
router.post("/", authorize("CREATE_FUEL") as any, validateRequest(createFuelSchema), controller.create as any);

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
router.get("/", authorize("VIEW_FUEL") as any, controller.list as any);

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
router.get("/:id", authorize("VIEW_FUEL") as any, controller.getById as any);

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
router.patch("/:id", authorize("CREATE_FUEL") as any, validateRequest(updateFuelSchema), controller.update as any);

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
router.delete("/:id", authorize("CREATE_FUEL") as any, controller.delete as any);

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
router.get("/vehicle/:vehicleId/metrics", authorize("VIEW_FUEL") as any, controller.getMetrics as any);

export default router;
