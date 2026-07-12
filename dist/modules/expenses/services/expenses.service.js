"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const expenses_repository_1 = require("../repositories/expenses.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
const logger_1 = require("../../../config/logger");
const redis_1 = require("../../../config/redis");
class ExpensesService {
    repository = new expenses_repository_1.ExpensesRepository();
    async createExpense(data, userId) {
        const vehicle = await database_1.prisma.vehicle.findFirst({
            where: { id: data.vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        if (data.tripId) {
            const trip = await database_1.prisma.trip.findFirst({
                where: { id: data.tripId, vehicleId: data.vehicleId, deletedAt: null },
            });
            if (!trip) {
                throw new app_error_1.BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
            }
        }
        const expense = await this.repository.create(data);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "CREATE_EXPENSE",
                entity: "EXPENSE",
                entityId: expense.id,
                details: { vehicleId: expense.vehicleId, category: expense.category, amount: expense.amount },
            },
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Expense log recorded for vehicle ${expense.vehicleId}.`);
        return expense;
    }
    async updateExpense(id, data, userId) {
        const expense = await this.repository.findById(id);
        if (!expense) {
            throw new app_error_1.NotFoundError("Expense not found.");
        }
        if (data.tripId) {
            const trip = await database_1.prisma.trip.findFirst({
                where: { id: data.tripId, vehicleId: expense.vehicleId, deletedAt: null },
            });
            if (!trip) {
                throw new app_error_1.BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
            }
        }
        const updated = await this.repository.update(id, data);
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "UPDATE_EXPENSE",
                entity: "EXPENSE",
                entityId: id,
                details: data,
            },
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
        return updated;
    }
    async getExpenseById(id) {
        const expense = await this.repository.findById(id);
        if (!expense) {
            throw new app_error_1.NotFoundError("Expense not found.");
        }
        return expense;
    }
    async getAllExpenses(filters) {
        return this.repository.findAll(filters);
    }
    async deleteExpense(id, userId) {
        const expense = await this.repository.findById(id);
        if (!expense) {
            throw new app_error_1.NotFoundError("Expense not found.");
        }
        await this.repository.delete(id);
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "DELETE_EXPENSE",
                entity: "EXPENSE",
                entityId: id,
            },
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
    }
    async getVehicleOperationalCost(vehicleId) {
        const vehicle = await database_1.prisma.vehicle.findFirst({
            where: { id: vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        const expenses = await database_1.prisma.expense.findMany({
            where: { vehicleId, deletedAt: null },
        });
        const fuelLogs = await database_1.prisma.fuelLog.findMany({
            where: { vehicleId, deletedAt: null },
        });
        // Sub-totals
        const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
        const repairsCost = expenses
            .filter((e) => e.category === client_1.ExpenseCategory.REPAIRS)
            .reduce((sum, e) => sum + e.amount, 0);
        const tollsCost = expenses
            .filter((e) => e.category === client_1.ExpenseCategory.TOLLS)
            .reduce((sum, e) => sum + e.amount, 0);
        const parkingCost = expenses
            .filter((e) => e.category === client_1.ExpenseCategory.PARKING)
            .reduce((sum, e) => sum + e.amount, 0);
        const insuranceCost = expenses
            .filter((e) => e.category === client_1.ExpenseCategory.INSURANCE)
            .reduce((sum, e) => sum + e.amount, 0);
        const miscCost = expenses
            .filter((e) => e.category === client_1.ExpenseCategory.MISCELLANEOUS)
            .reduce((sum, e) => sum + e.amount, 0);
        const otherExpensesCost = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalOperatingCost = fuelCost + otherExpensesCost;
        // Distances from completed trips
        const trips = await database_1.prisma.trip.findMany({
            where: {
                vehicleId,
                status: client_1.TripStatus.COMPLETED,
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
exports.ExpensesService = ExpensesService;
