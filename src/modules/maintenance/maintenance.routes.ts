import { Router } from "express";
import { MaintenanceController } from "./controllers/maintenance.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { createMaintenanceSchema, updateMaintenanceSchema } from "./validators/maintenance.validator";

const router = Router();
const controller = new MaintenanceController();

// All routes require authentication
router.use(authenticate as any);

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
router.post("/", authorize("CREATE_MAINTENANCE") as any, validateRequest(createMaintenanceSchema), controller.create as any);

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
router.get("/", authorize("VIEW_MAINTENANCE") as any, controller.list as any);

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
router.get("/:id", authorize("VIEW_MAINTENANCE") as any, controller.getById as any);

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
router.patch("/:id", authorize("UPDATE_MAINTENANCE") as any, validateRequest(updateMaintenanceSchema), controller.update as any);

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
router.delete("/:id", authorize("UPDATE_MAINTENANCE") as any, controller.delete as any);

export default router;
