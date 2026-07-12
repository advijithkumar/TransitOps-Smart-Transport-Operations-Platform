import { Router } from "express";
import { ExpensesController } from "./controllers/expenses.controller";
import { validateRequest } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { createExpenseSchema, updateExpenseSchema } from "./validators/expenses.validator";

const router = Router();
const controller = new ExpensesController();

// All routes require authentication
router.use(authenticate as any);

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Log a vehicle expense entry
 *     tags: [Expenses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, category, amount, date]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               tripId:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *                 enum: [TOLLS, PARKING, REPAIRS, INSURANCE, MISCELLANEOUS]
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense recorded successfully
 */
router.post("/", authorize("CREATE_EXPENSE") as any, validateRequest(createExpenseSchema), controller.create as any);

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: List all expenses
 *     tags: [Expenses]
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [TOLLS, PARKING, REPAIRS, INSURANCE, MISCELLANEOUS]
 *     responses:
 *       200:
 *         description: Expense list
 */
router.get("/", authorize("VIEW_EXPENSE") as any, controller.list as any);

/**
 * @swagger
 * /expenses/{id}:
 *   get:
 *     summary: Get expense log details
 *     tags: [Expenses]
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
 *         description: Expense details
 */
router.get("/:id", authorize("VIEW_EXPENSE") as any, controller.getById as any);

/**
 * @swagger
 * /expenses/{id}:
 *   patch:
 *     summary: Update expense entry
 *     tags: [Expenses]
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
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [TOLLS, PARKING, REPAIRS, INSURANCE, MISCELLANEOUS]
 *     responses:
 *       200:
 *         description: Expense updated
 */
router.patch("/:id", authorize("CREATE_EXPENSE") as any, validateRequest(updateExpenseSchema), controller.update as any);

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Soft-delete expense record
 *     tags: [Expenses]
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
 *         description: Expense deleted
 */
router.delete("/:id", authorize("CREATE_EXPENSE") as any, controller.delete as any);

/**
 * @swagger
 * /expenses/vehicle/{vehicleId}/cost:
 *   get:
 *     summary: Get aggregated vehicle operational costs including fuel logs and breakdowns
 *     tags: [Expenses]
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
 *         description: Aggregated operational cost breakdown
 */
router.get("/vehicle/:vehicleId/cost", authorize("VIEW_EXPENSE") as any, controller.getOperationalCost as any);

export default router;
