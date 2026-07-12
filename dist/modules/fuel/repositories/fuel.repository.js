"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelRepository = void 0;
const database_1 = require("../../../config/database");
class FuelRepository {
    async findById(id) {
        return database_1.prisma.fuelLog.findFirst({
            where: { id, deletedAt: null },
            include: {
                vehicle: true,
                trip: true,
            },
        });
    }
    async findAll(filters) {
        return database_1.prisma.fuelLog.findMany({
            where: {
                ...filters,
                deletedAt: null,
            },
            include: {
                vehicle: true,
                trip: true,
            },
        });
    }
    async create(data) {
        return database_1.prisma.fuelLog.create({
            data: {
                ...data,
                date: new Date(data.date),
            },
            include: {
                vehicle: true,
                trip: true,
            },
        });
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.date) {
            updateData.date = new Date(data.date);
        }
        return database_1.prisma.fuelLog.update({
            where: { id },
            data: updateData,
            include: {
                vehicle: true,
                trip: true,
            },
        });
    }
    async delete(id) {
        return database_1.prisma.fuelLog.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
exports.FuelRepository = FuelRepository;
