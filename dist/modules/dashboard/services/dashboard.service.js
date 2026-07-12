"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const database_1 = require("../../../config/database");
const redis_1 = require("../../../config/redis");
const client_1 = require("@prisma/client");
const DASHBOARD_CACHE_KEY = "dashboard_kpis";
const DASHBOARD_CACHE_TTL = 60; // 60 seconds
class DashboardService {
    async getKPIs() {
        // Try cache first
        const cached = await (0, redis_1.cacheGet)(DASHBOARD_CACHE_KEY);
        if (cached)
            return cached;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalVehicles, availableVehicles, vehiclesOnTrip, vehiclesInShop, retiredVehicles, totalDrivers, driversAvailable, driversOnTrip, driversOffDuty, driversSuspended, tripsToday, tripsCompleted, activeTrips, fuelCostResult, maintenanceCostResult, revenueResult,] = await Promise.all([
            database_1.prisma.vehicle.count({ where: { deletedAt: null } }),
            database_1.prisma.vehicle.count({ where: { status: client_1.VehicleStatus.AVAILABLE, deletedAt: null } }),
            database_1.prisma.vehicle.count({ where: { status: client_1.VehicleStatus.ON_TRIP, deletedAt: null } }),
            database_1.prisma.vehicle.count({ where: { status: client_1.VehicleStatus.IN_SHOP, deletedAt: null } }),
            database_1.prisma.vehicle.count({ where: { status: client_1.VehicleStatus.RETIRED, deletedAt: null } }),
            database_1.prisma.driver.count({ where: { deletedAt: null } }),
            database_1.prisma.driver.count({ where: { status: client_1.DriverStatus.AVAILABLE, deletedAt: null } }),
            database_1.prisma.driver.count({ where: { status: client_1.DriverStatus.ON_TRIP, deletedAt: null } }),
            database_1.prisma.driver.count({ where: { status: client_1.DriverStatus.OFF_DUTY, deletedAt: null } }),
            database_1.prisma.driver.count({ where: { status: client_1.DriverStatus.SUSPENDED, deletedAt: null } }),
            database_1.prisma.trip.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
            database_1.prisma.trip.count({ where: { status: client_1.TripStatus.COMPLETED, deletedAt: null } }),
            database_1.prisma.trip.count({ where: { status: client_1.TripStatus.DISPATCHED, deletedAt: null } }),
            database_1.prisma.fuelLog.aggregate({ _sum: { cost: true }, where: { deletedAt: null } }),
            database_1.prisma.maintenanceLog.aggregate({ _sum: { cost: true }, where: { deletedAt: null } }),
            database_1.prisma.trip.aggregate({
                _sum: { revenue: true },
                where: { status: client_1.TripStatus.COMPLETED, deletedAt: null },
            }),
        ]);
        const totalFuelCost = fuelCostResult._sum.cost ?? 0;
        const totalMaintenanceCost = maintenanceCostResult._sum.cost ?? 0;
        const totalRevenue = revenueResult._sum.revenue ?? 0;
        const totalExpenses = await database_1.prisma.expense.aggregate({ _sum: { amount: true }, where: { deletedAt: null } });
        const totalExpenseCost = totalExpenses._sum.amount ?? 0;
        const totalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;
        const profit = totalRevenue - totalCost;
        const fleetUtilization = totalVehicles > 0 ? Number(((vehiclesOnTrip / totalVehicles) * 100).toFixed(1)) : 0;
        const kpis = {
            fleet: {
                total: totalVehicles,
                available: availableVehicles,
                onTrip: vehiclesOnTrip,
                inShop: vehiclesInShop,
                retired: retiredVehicles,
                utilizationPercent: fleetUtilization,
            },
            drivers: {
                total: totalDrivers,
                available: driversAvailable,
                onTrip: driversOnTrip,
                offDuty: driversOffDuty,
                suspended: driversSuspended,
            },
            trips: {
                today: tripsToday,
                active: activeTrips,
                totalCompleted: tripsCompleted,
            },
            financials: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalFuelCost: Number(totalFuelCost.toFixed(2)),
                totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
                totalExpenseCost: Number(totalExpenseCost.toFixed(2)),
                totalCost: Number(totalCost.toFixed(2)),
                profit: Number(profit.toFixed(2)),
            },
        };
        // Cache result
        await (0, redis_1.cacheSet)(DASHBOARD_CACHE_KEY, kpis, DASHBOARD_CACHE_TTL);
        return kpis;
    }
    async getChartData() {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        // Group trips by day for the last 30 days
        const dailyTrips = await database_1.prisma.$queryRaw `
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM trips
      WHERE "createdAt" >= ${last30Days} AND "deletedAt" IS NULL
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
        // Monthly fuel cost trend
        const monthlyFuel = await database_1.prisma.$queryRaw `
      SELECT DATE_TRUNC('month', date) as month, SUM(cost) as total_cost, SUM(quantity) as total_liters
      FROM fuel_logs
      WHERE "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;
        // Monthly maintenance cost trend
        const monthlyMaintenance = await database_1.prisma.$queryRaw `
      SELECT DATE_TRUNC('month', date) as month, SUM(cost) as total_cost
      FROM maintenance_logs
      WHERE "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;
        // Expense category breakdown (pie chart)
        const expenseByCategory = await database_1.prisma.expense.groupBy({
            by: ["category"],
            _sum: { amount: true },
            where: { deletedAt: null },
        });
        return {
            dailyTrips,
            monthlyFuel,
            monthlyMaintenance,
            expenseByCategory: expenseByCategory.map((e) => ({
                category: e.category,
                total: Number((e._sum.amount ?? 0).toFixed(2)),
            })),
        };
    }
}
exports.DashboardService = DashboardService;
