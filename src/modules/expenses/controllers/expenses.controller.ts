import { Response, NextFunction } from "express";
import { ExpensesService } from "../services/expenses.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { ExpenseCategory } from "@prisma/client";

export class ExpensesController {
  private service = new ExpensesService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const expense = await this.service.createExpense(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Expense log recorded successfully",
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const expense = await this.service.updateExpense(req.params.id, req.body, userId);
      res.status(200).json({
        success: true,
        message: "Expense log updated successfully",
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.service.getExpenseById(req.params.id);
      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        vehicleId: req.query.vehicleId as string,
        tripId: req.query.tripId as string,
        category: req.query.category as ExpenseCategory,
      };
      const expenses = await this.service.getAllExpenses(filters);
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      await this.service.deleteExpense(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Expense log deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getOperationalCost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const costs = await this.service.getVehicleOperationalCost(req.params.vehicleId);
      res.status(200).json({
        success: true,
        data: costs,
      });
    } catch (error) {
      next(error);
    }
  };
}
