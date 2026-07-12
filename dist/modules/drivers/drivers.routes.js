"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drivers_controller_1 = require("./controllers/drivers.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const drivers_validator_1 = require("./validators/drivers.validator");
const router = (0, express_1.Router)();
const controller = new drivers_controller_1.DriversController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
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
router.post("/", (0, rbac_middleware_1.authorize)("CREATE_DRIVER"), (0, validation_middleware_1.validateRequest)(drivers_validator_1.createDriverSchema), controller.create);
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
router.get("/", (0, rbac_middleware_1.authorize)("VIEW_DRIVER"), controller.list);
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
router.get("/:id", (0, rbac_middleware_1.authorize)("VIEW_DRIVER"), controller.getById);
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
router.patch("/:id", (0, rbac_middleware_1.authorize)("UPDATE_DRIVER"), (0, validation_middleware_1.validateRequest)(drivers_validator_1.updateDriverSchema), controller.update);
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
router.delete("/:id", (0, rbac_middleware_1.authorize)("DELETE_DRIVER"), controller.delete);
exports.default = router;
