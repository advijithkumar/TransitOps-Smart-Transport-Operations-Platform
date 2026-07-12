"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesRepository = void 0;
const database_1 = require("../../../config/database");
class VehiclesRepository {
    async findById(id) {
        return database_1.prisma.vehicle.findFirst({
            where: { id, deletedAt: null },
            include: {
                type: true,
                region: true,
                gpsDevice: true,
            },
        });
    }
    async findByRegistrationNumber(registrationNumber) {
        return database_1.prisma.vehicle.findFirst({
            where: { registrationNumber, deletedAt: null },
        });
    }
    async findAll(filters) {
        return database_1.prisma.vehicle.findMany({
            where: {
                ...filters,
                deletedAt: null,
            },
            include: {
                type: true,
                region: true,
            },
        });
    }
    async create(data) {
        return database_1.prisma.vehicle.create({
            data,
            include: {
                type: true,
                region: true,
            },
        });
    }
    async update(id, data) {
        return database_1.prisma.vehicle.update({
            where: { id },
            data,
            include: {
                type: true,
                region: true,
            },
        });
    }
    async delete(id) {
        return database_1.prisma.vehicle.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
exports.VehiclesRepository = VehiclesRepository;
