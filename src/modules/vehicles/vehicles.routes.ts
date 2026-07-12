import { Router } from "express";
import { VehiclesController } from "./controllers/vehicles.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { createVehicleSchema, updateVehicleSchema } from "./validators/vehicles.validator";

const router = Router();
const controller = new VehiclesController();

// All routes require authentication
router.use(authenticate as any);

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
router.post("/", authorize("CREATE_VEHICLE") as any, validateRequest(createVehicleSchema), controller.create as any);

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
router.get("/", authorize("VIEW_VEHICLE") as any, controller.list as any);

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
router.get("/:id", authorize("VIEW_VEHICLE") as any, controller.getById as any);

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
router.patch("/:id", authorize("UPDATE_VEHICLE") as any, validateRequest(updateVehicleSchema), controller.update as any);

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
router.delete("/:id", authorize("DELETE_VEHICLE") as any, controller.delete as any);

export default router;
