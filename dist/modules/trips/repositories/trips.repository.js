"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsRepository = void 0;
const database_1 = require("../../../config/database");
class TripsRepository {
    async findById(id) {
        return database_1.prisma.trip.findFirst({
            where: { id, deletedAt: null },
            include: {
                vehicle: true,
                driver: true,
            },
        });
    }
    async findAll(filters) {
        return database_1.prisma.trip.findMany({
            where: {
                ...filters,
                deletedAt: null,
            },
            include: {
                vehicle: true,
                driver: true,
            },
        });
    }
    async create(data) {
        return database_1.prisma.trip.create({
            data,
            include: {
                vehicle: true,
                driver: true,
            },
        });
    }
    async update(id, data) {
        return database_1.prisma.trip.update({
            where: { id },
            data,
            include: {
                vehicle: true,
                driver: true,
            },
        });
    }
    async delete(id) {
        return database_1.prisma.trip.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
exports.TripsRepository = TripsRepository;
