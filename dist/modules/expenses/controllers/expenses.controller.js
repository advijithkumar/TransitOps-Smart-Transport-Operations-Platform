"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesController = void 0;
const expenses_service_1 = require("../services/expenses.service");
class ExpensesController {
    service = new expenses_service_1.ExpensesService();
    create = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const expense = await this.service.createExpense(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Expense log recorded successfully",
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const expense = await this.service.updateExpense(req.params.id, req.body, userId);
            res.status(200).json({
                success: true,
                message: "Expense log updated successfully",
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const expense = await this.service.getExpenseById(req.params.id);
            res.status(200).json({
                success: true,
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            const filters = {
                vehicleId: req.query.vehicleId,
                tripId: req.query.tripId,
                category: req.query.category,
            };
            const expenses = await this.service.getAllExpenses(filters);
            res.status(200).json({
                success: true,
                data: expenses,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            await this.service.deleteExpense(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Expense log deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
    getOperationalCost = async (req, res, next) => {
        try {
            const costs = await this.service.getVehicleOperationalCost(req.params.vehicleId);
            res.status(200).json({
                success: true,
                data: costs,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ExpensesController = ExpensesController;
