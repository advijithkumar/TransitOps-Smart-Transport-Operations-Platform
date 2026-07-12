"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceRepository = void 0;
const database_1 = require("../../../config/database");
class MaintenanceRepository {
    async findById(id) {
        return database_1.prisma.maintenanceLog.findFirst({
            where: { id, deletedAt: null },
            include: {
                vehicle: true,
            },
        });
    }
    async findAll(filters) {
        return database_1.prisma.maintenanceLog.findMany({
            where: {
                ...filters,
                deletedAt: null,
            },
            include: {
                vehicle: true,
            },
        });
    }
    async create(data) {
        return database_1.prisma.maintenanceLog.create({
            data: {
                ...data,
                date: new Date(data.date),
            },
            include: {
                vehicle: true,
            },
        });
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.date) {
            updateData.date = new Date(data.date);
        }
        return database_1.prisma.maintenanceLog.update({
            where: { id },
            data: updateData,
            include: {
                vehicle: true,
            },
        });
    }
    async delete(id) {
        return database_1.prisma.maintenanceLog.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
exports.MaintenanceRepository = MaintenanceRepository;
