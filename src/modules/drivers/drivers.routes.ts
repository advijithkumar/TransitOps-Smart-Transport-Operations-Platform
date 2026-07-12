import { Router } from "express";
import { DriversController } from "./controllers/drivers.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { createDriverSchema, updateDriverSchema } from "./validators/drivers.validator";

const router = Router();
const controller = new DriversController();

// All routes require authentication
router.use(authenticate as any);

/**
 * @swagger
 * /drivers:
 *   post:
 *     summary: Register a new driver
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, licenseNumber, licenseCategory, licenseExpiry, contactNumber]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dave Driver
 *               licenseNumber:
 *                 type: string
 *                 example: DL-736294
 *               licenseCategory:
 *                 type: string
 *                 example: Class A CDL
 *               licenseExpiry:
 *                 type: string
 *                 format: date-time
 *                 example: "2027-12-31T23:59:59Z"
 *               contactNumber:
 *                 type: string
 *                 example: "+15550302"
 *               safetyScore:
 *                 type: number
 *                 example: 98
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED]
 *                 example: AVAILABLE
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *     responses:
 *       201:
 *         description: Driver registered successfully
 */
router.post("/", authorize("CREATE_DRIVER") as any, validateRequest(createDriverSchema), controller.create as any);

/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED]
 *     responses:
 *       200:
 *         description: Driver list
 */
router.get("/", authorize("VIEW_DRIVER") as any, controller.list as any);

/**
 * @swagger
 * /drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Drivers]
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
 *         description: Driver details
 */
router.get("/:id", authorize("VIEW_DRIVER") as any, controller.getById as any);

/**
 * @swagger
 * /drivers/{id}:
 *   patch:
 *     summary: Update driver profile
 *     tags: [Drivers]
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
 *               safetyScore:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED]
 *     responses:
 *       200:
 *         description: Driver updated
 */
router.patch("/:id", authorize("UPDATE_DRIVER") as any, validateRequest(updateDriverSchema), controller.update as any);

/**
 * @swagger
 * /drivers/{id}:
 *   delete:
 *     summary: Soft-delete driver record
 *     tags: [Drivers]
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
 *         description: Driver deleted
 */
router.delete("/:id", authorize("DELETE_DRIVER") as any, controller.delete as any);

export default router;
