"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesService = void 0;
const vehicles_repository_1 = require("../repositories/vehicles.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const database_1 = require("../../../config/database");
class VehiclesService {
    repository = new vehicles_repository_1.VehiclesRepository();
    async createVehicle(data, userId) {
        const existing = await this.repository.findByRegistrationNumber(data.registrationNumber);
        if (existing) {
            throw new app_error_1.ConflictError(`Vehicle with registration number '${data.registrationNumber}' already exists.`);
        }
        // Verify VehicleType exists
        const typeExists = await database_1.prisma.vehicleType.findUnique({
            where: { id: data.typeId },
        });
        if (!typeExists) {
            throw new app_error_1.BadRequestError(`Vehicle type with ID '${data.typeId}' not found.`);
        }
        // Verify Region exists
        if (data.regionId) {
            const regionExists = await database_1.prisma.region.findUnique({
                where: { id: data.regionId },
            });
            if (!regionExists) {
                throw new app_error_1.BadRequestError(`Region with ID '${data.regionId}' not found.`);
            }
        }
        const vehicle = await this.repository.create(data);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "CREATE_VEHICLE",
                entity: "VEHICLE",
                entityId: vehicle.id,
                details: { registrationNumber: vehicle.registrationNumber },
            },
        });
        return vehicle;
    }
    async updateVehicle(id, data, userId) {
        const vehicle = await this.repository.findById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
            const existing = await this.repository.findByRegistrationNumber(data.registrationNumber);
            if (existing) {
                throw new app_error_1.ConflictError(`Vehicle with registration number '${data.registrationNumber}' already exists.`);
            }
        }
        if (data.typeId) {
            const typeExists = await database_1.prisma.vehicleType.findUnique({
                where: { id: data.typeId },
            });
            if (!typeExists) {
                throw new app_error_1.BadRequestError(`Vehicle type with ID '${data.typeId}' not found.`);
            }
        }
        if (data.regionId) {
            const regionExists = await database_1.prisma.region.findUnique({
                where: { id: data.regionId },
            });
            if (!regionExists) {
                throw new app_error_1.BadRequestError(`Region with ID '${data.regionId}' not found.`);
            }
        }
        const updated = await this.repository.update(id, data);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "UPDATE_VEHICLE",
                entity: "VEHICLE",
                entityId: updated.id,
                details: data,
            },
        });
        return updated;
    }
    async getVehicleById(id) {
        const vehicle = await this.repository.findById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        return vehicle;
    }
    async getAllVehicles(filters) {
        return this.repository.findAll(filters);
    }
    async deleteVehicle(id, userId) {
        const vehicle = await this.repository.findById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        await this.repository.delete(id);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "DELETE_VEHICLE",
                entity: "VEHICLE",
                entityId: id,
            },
        });
    }
}
exports.VehiclesService = VehiclesService;
