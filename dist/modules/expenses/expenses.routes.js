"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenses_controller_1 = require("./controllers/expenses.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const expenses_validator_1 = require("./validators/expenses.validator");
const router = (0, express_1.Router)();
const controller = new expenses_controller_1.ExpensesController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
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
router.post("/", (0, rbac_middleware_1.authorize)("CREATE_EXPENSE"), (0, validation_middleware_1.validateRequest)(expenses_validator_1.createExpenseSchema), controller.create);
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
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_EXPENSE"), controller.list);
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
router.get("/:id", (0, rbac_middleware_1.authorize)("VIEW_EXPENSE"), controller.getById);
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
router.patch("/:id", (0, rbac_middleware_1.authorize)("CREATE_EXPENSE"), (0, validation_middleware_1.validateRequest)(expenses_validator_1.updateExpenseSchema), controller.update);
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
router.delete("/:id", (0, rbac_middleware_1.authorize)("CREATE_EXPENSE"), controller.delete);
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
router.get("/vehicle/:vehicleId/cost", (0, rbac_middleware_1.authorize)("VIEW_EXPENSE"), controller.getOperationalCost);
exports.default = router;
