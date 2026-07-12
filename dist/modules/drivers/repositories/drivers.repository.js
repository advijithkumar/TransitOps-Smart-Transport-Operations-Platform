"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversRepository = void 0;
const database_1 = require("../../../config/database");
class DriversRepository {
    async findById(id) {
        return database_1.prisma.driver.findFirst({
            where: { id, deletedAt: null },
            include: {
                user: true,
            },
        });
    }
    async findByLicenseNumber(licenseNumber) {
        return database_1.prisma.driver.findFirst({
            where: { licenseNumber, deletedAt: null },
        });
    }
    async findAll(filters) {
        return database_1.prisma.driver.findMany({
            where: {
                ...filters,
                deletedAt: null,
            },
            include: {
                user: true,
            },
        });
    }
    async create(data) {
        return database_1.prisma.driver.create({
            data: {
                ...data,
                licenseExpiry: new Date(data.licenseExpiry),
            },
        });
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.licenseExpiry) {
            updateData.licenseExpiry = new Date(data.licenseExpiry);
        }
        return database_1.prisma.driver.update({
            where: { id },
            data: updateData,
        });
    }
    async delete(id) {
        return database_1.prisma.driver.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
exports.DriversRepository = DriversRepository;
