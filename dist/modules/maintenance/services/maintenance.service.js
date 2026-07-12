"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceService = void 0;
const maintenance_repository_1 = require("../repositories/maintenance.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
const logger_1 = require("../../../config/logger");
const redis_1 = require("../../../config/redis");
class MaintenanceService {
    repository = new maintenance_repository_1.MaintenanceRepository();
    async createLog(data, userId) {
        const vehicle = await database_1.prisma.vehicle.findFirst({
            where: { id: data.vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        if (vehicle.status === client_1.VehicleStatus.ON_TRIP) {
            throw new app_error_1.BadRequestError("Cannot send vehicle to maintenance: Vehicle is currently ON_TRIP.");
        }
        const log = await database_1.prisma.$transaction(async (tx) => {
            // 1. If maintenance log status is not CANCELLED or COMPLETED immediately, set vehicle to IN_SHOP
            const setInShop = data.status !== client_1.MaintenanceStatus.COMPLETED && data.status !== client_1.MaintenanceStatus.CANCELLED;
            if (setInShop) {
                await tx.vehicle.update({
                    where: { id: data.vehicleId },
                    data: { status: client_1.VehicleStatus.IN_SHOP },
                });
            }
            // 2. Create the maintenance log
            const dateVal = new Date(data.date);
            const logRecord = await tx.maintenanceLog.create({
                data: {
                    vehicleId: data.vehicleId,
                    type: data.type,
                    cost: data.cost,
                    vendor: data.vendor,
                    date: dateVal,
                    status: data.status,
                    description: data.description,
                },
                include: { vehicle: true },
            });
            // 3. If immediately created as COMPLETED, also log a Repair Expense
            if (data.status === client_1.MaintenanceStatus.COMPLETED && data.cost > 0) {
                await tx.expense.create({
                    data: {
                        vehicleId: data.vehicleId,
                        category: client_1.ExpenseCategory.REPAIRS,
                        amount: data.cost,
                        date: dateVal,
                        description: `Auto-Logged repair: ${data.type} by ${data.vendor}. Details: ${data.description || ""}`,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId,
                    action: "CREATE_MAINTENANCE",
                    entity: "MAINTENANCE",
                    entityId: logRecord.id,
                    details: { vehicleId: data.vehicleId, cost: data.cost },
                },
            });
            return logRecord;
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Maintenance log created for vehicle ${data.vehicleId}.`);
        return log;
    }
    async updateLog(id, data, userId) {
        const log = await this.repository.findById(id);
        if (!log) {
            throw new app_error_1.NotFoundError("Maintenance log not found.");
        }
        const updatedLog = await database_1.prisma.$transaction(async (tx) => {
            // Check if status is transitioning to closed (COMPLETED or CANCELLED) from open
            const wasOpen = log.status !== client_1.MaintenanceStatus.COMPLETED && log.status !== client_1.MaintenanceStatus.CANCELLED;
            const isClosing = data.status === client_1.MaintenanceStatus.COMPLETED || data.status === client_1.MaintenanceStatus.CANCELLED;
            if (wasOpen && isClosing) {
                // Automatically restore vehicle status to AVAILABLE
                await tx.vehicle.update({
                    where: { id: log.vehicleId },
                    data: { status: client_1.VehicleStatus.AVAILABLE },
                });
                // Automatically log repairs cost in Expenses table if transitioning to COMPLETED
                if (data.status === client_1.MaintenanceStatus.COMPLETED && log.cost > 0) {
                    await tx.expense.create({
                        data: {
                            vehicleId: log.vehicleId,
                            category: client_1.ExpenseCategory.REPAIRS,
                            amount: log.cost,
                            date: log.date,
                            description: `Auto-Logged repair: ${log.type} by ${log.vendor}. Status: Completed`,
                        },
                    });
                }
            }
            // If updating status back to open, make vehicle IN_SHOP again
            const isOpening = wasOpen === false && (data.status === client_1.MaintenanceStatus.SCHEDULED || data.status === client_1.MaintenanceStatus.IN_PROGRESS);
            if (isOpening) {
                const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
                if (vehicle && vehicle.status === client_1.VehicleStatus.ON_TRIP) {
                    throw new app_error_1.BadRequestError("Cannot reopen maintenance: Vehicle is currently ON_TRIP.");
                }
                await tx.vehicle.update({
                    where: { id: log.vehicleId },
                    data: { status: client_1.VehicleStatus.IN_SHOP },
                });
            }
            const updateData = { ...data };
            if (data.date) {
                updateData.date = new Date(data.date);
            }
            const record = await tx.maintenanceLog.update({
                where: { id },
                data: updateData,
                include: { vehicle: true },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: "UPDATE_MAINTENANCE",
                    entity: "MAINTENANCE",
                    entityId: id,
                    details: data,
                },
            });
            return record;
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Maintenance log ${id} updated.`);
        return updatedLog;
    }
    async getLogById(id) {
        const log = await this.repository.findById(id);
        if (!log) {
            throw new app_error_1.NotFoundError("Maintenance log not found.");
        }
        return log;
    }
    async getAllLogs(filters) {
        return this.repository.findAll(filters);
    }
    async deleteLog(id, userId) {
        const log = await this.repository.findById(id);
        if (!log) {
            throw new app_error_1.NotFoundError("Maintenance log not found.");
        }
        await database_1.prisma.$transaction(async (tx) => {
            // If deleted log was open and holding the vehicle IN_SHOP, restore vehicle status
            const wasOpen = log.status !== client_1.MaintenanceStatus.COMPLETED && log.status !== client_1.MaintenanceStatus.CANCELLED;
            if (wasOpen) {
                await tx.vehicle.update({
                    where: { id: log.vehicleId },
                    data: { status: client_1.VehicleStatus.AVAILABLE },
                });
            }
            await tx.maintenanceLog.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: "DELETE_MAINTENANCE",
                    entity: "MAINTENANCE",
                    entityId: id,
                },
            });
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
    }
}
exports.MaintenanceService = MaintenanceService;
