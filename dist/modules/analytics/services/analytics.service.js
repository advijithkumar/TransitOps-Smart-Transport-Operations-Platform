"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
class AnalyticsService {
    async getFleetUtilization() {
        const vehicles = await database_1.prisma.vehicle.findMany({
            where: { deletedAt: null },
            include: {
                trips: {
                    where: { status: client_1.TripStatus.COMPLETED, deletedAt: null },
                },
                fuelLogs: { where: { deletedAt: null } },
                expenses: { where: { deletedAt: null } },
            },
        });
        return vehicles.map((v) => {
            const totalDistance = v.trips.reduce((sum, t) => sum + (t.actualDistance ?? 0), 0);
            const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue ?? 0), 0);
            const totalFuel = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
            const totalExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalCost = totalFuel + totalExpenses;
            const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalCost) / v.acquisitionCost) * 100 : 0;
            const fuelQty = v.fuelLogs.reduce((sum, f) => sum + f.quantity, 0);
            const fuelEfficiency = fuelQty > 0 ? totalDistance / fuelQty : 0;
            return {
                vehicleId: v.id,
                registrationNumber: v.registrationNumber,
                name: v.name,
                status: v.status,
                totalTrips: v.trips.length,
                totalDistanceKm: Number(totalDistance.toFixed(2)),
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalCost: Number(totalCost.toFixed(2)),
                profit: Number((totalRevenue - totalCost).toFixed(2)),
                roiPercent: Number(roi.toFixed(2)),
                fuelEfficiencyKmL: Number(fuelEfficiency.toFixed(2)),
                acquisitionCost: v.acquisitionCost,
            };
        });
    }
    async getMonthlyReport(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const [trips, fuelLogs, expenses, maintenanceLogs] = await Promise.all([
            database_1.prisma.trip.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                include: { vehicle: true, driver: true },
            }),
            database_1.prisma.fuelLog.findMany({
                where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
            }),
            database_1.prisma.expense.findMany({
                where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
            }),
            database_1.prisma.maintenanceLog.findMany({
                where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
            }),
        ]);
        const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue ?? 0), 0);
        const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
        const totalCost = totalFuelCost + totalExpenses + totalMaintenanceCost;
        return {
            period: `${year}-${String(month).padStart(2, "0")}`,
            trips: {
                total: trips.length,
                completed: trips.filter((t) => t.status === client_1.TripStatus.COMPLETED).length,
                cancelled: trips.filter((t) => t.status === "CANCELLED").length,
                records: trips,
            },
            financials: {
                revenue: Number(totalRevenue.toFixed(2)),
                fuelCost: Number(totalFuelCost.toFixed(2)),
                expensesCost: Number(totalExpenses.toFixed(2)),
                maintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
                totalCost: Number(totalCost.toFixed(2)),
                profit: Number((totalRevenue - totalCost).toFixed(2)),
            },
        };
    }
    async getDriverPerformance() {
        const drivers = await database_1.prisma.driver.findMany({
            where: { deletedAt: null },
            include: {
                trips: {
                    where: { status: client_1.TripStatus.COMPLETED, deletedAt: null },
                },
            },
        });
        return drivers.map((d) => ({
            driverId: d.id,
            name: d.name,
            licenseCategory: d.licenseCategory,
            safetyScore: d.safetyScore,
            status: d.status,
            totalTripsCompleted: d.trips.length,
            totalDistanceKm: Number(d.trips.reduce((sum, t) => sum + (t.actualDistance ?? 0), 0).toFixed(2)),
            totalRevenue: Number(d.trips.reduce((sum, t) => sum + (t.revenue ?? 0), 0).toFixed(2)),
        }));
    }
}
exports.AnalyticsService = AnalyticsService;
