"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelService = void 0;
const fuel_repository_1 = require("../repositories/fuel.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
const logger_1 = require("../../../config/logger");
const redis_1 = require("../../../config/redis");
class FuelService {
    repository = new fuel_repository_1.FuelRepository();
    async createLog(data, userId) {
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
        const log = await this.repository.create(data);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "CREATE_FUEL_LOG",
                entity: "FUEL",
                entityId: log.id,
                details: { vehicleId: log.vehicleId, quantity: log.quantity, cost: log.cost },
            },
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Fuel log created for vehicle ${log.vehicleId}.`);
        return log;
    }
    async updateLog(id, data, userId) {
        const log = await this.repository.findById(id);
        if (!log) {
            throw new app_error_1.NotFoundError("Fuel log not found.");
        }
        if (data.tripId) {
            const trip = await database_1.prisma.trip.findFirst({
                where: { id: data.tripId, vehicleId: log.vehicleId, deletedAt: null },
            });
            if (!trip) {
                throw new app_error_1.BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
            }
        }
        const updated = await this.repository.update(id, data);
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "UPDATE_FUEL_LOG",
                entity: "FUEL",
                entityId: id,
                details: data,
            },
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
        return updated;
    }
    async getLogById(id) {
        const log = await this.repository.findById(id);
        if (!log) {
            throw new app_error_1.NotFoundError("Fuel log not found.");
        }
        return log;
    }
    async getAllLogs(filters) {
        return this.repository.findAll(filters);
    }
    async deleteLog(id, userId) {
        const log = await this.repository.findById(id);
        if (!log) {
            throw new app_error_1.NotFoundError("Fuel log not found.");
        }
        await this.repository.delete(id);
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "DELETE_FUEL_LOG",
                entity: "FUEL",
                entityId: id,
            },
        });
        await (0, redis_1.cacheDel)("dashboard_kpis");
    }
    async getFuelMetricsForVehicle(vehicleId) {
        const vehicle = await database_1.prisma.vehicle.findFirst({
            where: { id: vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        const fuelLogs = await database_1.prisma.fuelLog.findMany({
            where: { vehicleId, deletedAt: null },
        });
        // Sum fuel
        const totalQuantity = fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
        const totalCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
        // Sum completed trip distances for calculations
        const trips = await database_1.prisma.trip.findMany({
            where: {
                vehicleId,
                status: client_1.TripStatus.COMPLETED,
                deletedAt: null,
            },
        });
        const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
        // Metrics calculations
        const fuelEfficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0.0; // km/L
        const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0.0; // $/km
        return {
            vehicleId,
            registrationNumber: vehicle.registrationNumber,
            totalDistanceKm: totalDistance,
            totalQuantityLiters: totalQuantity,
            totalCost: totalCost,
            fuelEfficiencyKmL: Number(fuelEfficiency.toFixed(2)),
            costPerKm: Number(costPerKm.toFixed(2)),
        };
    }
}
exports.FuelService = FuelService;
