import { ExpensesRepository, ExpenseFilters } from "../repositories/expenses.repository";
import { NotFoundError, BadRequestError } from "../../../shared/errors/app-error";
import { prisma } from "../../../config/database";
import { Expense, ExpenseCategory, TripStatus } from "@prisma/client";
import { logger } from "../../../config/logger";
import { cacheDel } from "../../../config/redis";

export class ExpensesService {
  private repository = new ExpensesRepository();

  async createExpense(data: any, userId?: string): Promise<Expense> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }

    if (data.tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: data.tripId, vehicleId: data.vehicleId, deletedAt: null },
      });
      if (!trip) {
        throw new BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
      }
    }

    const expense = await this.repository.create(data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_EXPENSE",
        entity: "EXPENSE",
        entityId: expense.id,
        details: { vehicleId: expense.vehicleId, category: expense.category, amount: expense.amount },
      },
    });

    await cacheDel("dashboard_kpis");
    logger.info(`Expense log recorded for vehicle ${expense.vehicleId}.`);
    return expense;
  }

  async updateExpense(id: string, data: any, userId?: string): Promise<Expense> {
    const expense = await this.repository.findById(id);
    if (!expense) {
      throw new NotFoundError("Expense not found.");
    }

    if (data.tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: data.tripId, vehicleId: expense.vehicleId, deletedAt: null },
      });
      if (!trip) {
        throw new BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
      }
    }

    const updated = await this.repository.update(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_EXPENSE",
        entity: "EXPENSE",
        entityId: id,
        details: data,
      },
    });

    await cacheDel("dashboard_kpis");
    return updated;
  }

  async getExpenseById(id: string): Promise<Expense> {
    const expense = await this.repository.findById(id);
    if (!expense) {
      throw new NotFoundError("Expense not found.");
    }
    return expense;
  }

  async getAllExpenses(filters: ExpenseFilters): Promise<Expense[]> {
    return this.repository.findAll(filters);
  }

  async deleteExpense(id: string, userId?: string): Promise<void> {
    const expense = await this.repository.findById(id);
    if (!expense) {
      throw new NotFoundError("Expense not found.");
    }

    await this.repository.delete(id);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_EXPENSE",
        entity: "EXPENSE",
        entityId: id,
      },
    });

    await cacheDel("dashboard_kpis");
  }

  async getVehicleOperationalCost(vehicleId: string): Promise<any> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }

    const expenses = await prisma.expense.findMany({
      where: { vehicleId, deletedAt: null },
    });

    const fuelLogs = await prisma.fuelLog.findMany({
      where: { vehicleId, deletedAt: null },
    });

    // Sub-totals
    const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const repairsCost = expenses
      .filter((e) => e.category === ExpenseCategory.REPAIRS)
      .reduce((sum, e) => sum + e.amount, 0);
    const tollsCost = expenses
      .filter((e) => e.category === ExpenseCategory.TOLLS)
      .reduce((sum, e) => sum + e.amount, 0);
    const parkingCost = expenses
      .filter((e) => e.category === ExpenseCategory.PARKING)
      .reduce((sum, e) => sum + e.amount, 0);
    const insuranceCost = expenses
      .filter((e) => e.category === ExpenseCategory.INSURANCE)
      .reduce((sum, e) => sum + e.amount, 0);
    const miscCost = expenses
      .filter((e) => e.category === ExpenseCategory.MISCELLANEOUS)
      .reduce((sum, e) => sum + e.amount, 0);

    const otherExpensesCost = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOperatingCost = fuelCost + otherExpensesCost;

    // Distances from completed trips
    const trips = await prisma.trip.findMany({
      where: {
        vehicleId,
        status: TripStatus.COMPLETED,
        deletedAt: null,
      },
    });
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
    const costPerKm = totalDistance > 0 ? totalOperatingCost / totalDistance : 0.0;

    return {
      vehicleId,
      registrationNumber: vehicle.registrationNumber,
      totalDistanceKm: totalDistance,
      fuelCost: Number(fuelCost.toFixed(2)),
      repairsCost: Number(repairsCost.toFixed(2)),
      tollsCost: Number(tollsCost.toFixed(2)),
      parkingCost: Number(parkingCost.toFixed(2)),
      insuranceCost: Number(insuranceCost.toFixed(2)),
      miscCost: Number(miscCost.toFixed(2)),
      totalOperatingCost: Number(totalOperatingCost.toFixed(2)),
      costPerKm: Number(costPerKm.toFixed(2)),
    };
  }
}
