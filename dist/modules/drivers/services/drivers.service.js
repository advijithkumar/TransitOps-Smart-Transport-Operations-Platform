"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = void 0;
const drivers_repository_1 = require("../repositories/drivers.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const database_1 = require("../../../config/database");
class DriversService {
    repository = new drivers_repository_1.DriversRepository();
    async createDriver(data, userId) {
        const existing = await this.repository.findByLicenseNumber(data.licenseNumber);
        if (existing) {
            throw new app_error_1.ConflictError(`Driver with license number '${data.licenseNumber}' already exists.`);
        }
        if (data.userId) {
            const userExists = await database_1.prisma.user.findFirst({
                where: { id: data.userId, deletedAt: null },
            });
            if (!userExists) {
                throw new app_error_1.BadRequestError(`User with ID '${data.userId}' does not exist.`);
            }
            // Check if user is already associated with a driver
            const linkedDriver = await database_1.prisma.driver.findFirst({
                where: { userId: data.userId, deletedAt: null },
            });
            if (linkedDriver) {
                throw new app_error_1.ConflictError(`User is already linked to driver '${linkedDriver.name}'.`);
            }
        }
        const driver = await this.repository.create(data);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "CREATE_DRIVER",
                entity: "DRIVER",
                entityId: driver.id,
                details: { licenseNumber: driver.licenseNumber },
            },
        });
        return driver;
    }
    async updateDriver(id, data, userId) {
        const driver = await this.repository.findById(id);
        if (!driver) {
            throw new app_error_1.NotFoundError("Driver not found.");
        }
        if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
            const existing = await this.repository.findByLicenseNumber(data.licenseNumber);
            if (existing) {
                throw new app_error_1.ConflictError(`Driver with license number '${data.licenseNumber}' already exists.`);
            }
        }
        if (data.userId && data.userId !== driver.userId) {
            const userExists = await database_1.prisma.user.findFirst({
                where: { id: data.userId, deletedAt: null },
            });
            if (!userExists) {
                throw new app_error_1.BadRequestError(`User with ID '${data.userId}' does not exist.`);
            }
            const linkedDriver = await database_1.prisma.driver.findFirst({
                where: { userId: data.userId, deletedAt: null },
            });
            if (linkedDriver && linkedDriver.id !== id) {
                throw new app_error_1.ConflictError(`User is already linked to driver '${linkedDriver.name}'.`);
            }
        }
        const updated = await this.repository.update(id, data);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "UPDATE_DRIVER",
                entity: "DRIVER",
                entityId: updated.id,
                details: data,
            },
        });
        return updated;
    }
    async getDriverById(id) {
        const driver = await this.repository.findById(id);
        if (!driver) {
            throw new app_error_1.NotFoundError("Driver not found.");
        }
        return driver;
    }
    async getAllDrivers(filters) {
        return this.repository.findAll(filters);
    }
    async deleteDriver(id, userId) {
        const driver = await this.repository.findById(id);
        if (!driver) {
            throw new app_error_1.NotFoundError("Driver not found.");
        }
        await this.repository.delete(id);
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "DELETE_DRIVER",
                entity: "DRIVER",
                entityId: id,
            },
        });
    }
}
exports.DriversService = DriversService;
