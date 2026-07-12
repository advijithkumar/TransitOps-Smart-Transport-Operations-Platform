import { prisma } from "../../../config/database";
import { cacheGet, cacheSet } from "../../../config/redis";
import { VehicleStatus, DriverStatus, TripStatus } from "@prisma/client";

const DASHBOARD_CACHE_KEY = "dashboard_kpis";
const DASHBOARD_CACHE_TTL = 60; // 60 seconds

export class DashboardService {
  async getKPIs(): Promise<any> {
    // Try cache first
    const cached = await cacheGet<any>(DASHBOARD_CACHE_KEY);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalVehicles,
      availableVehicles,
      vehiclesOnTrip,
      vehiclesInShop,
      retiredVehicles,
      totalDrivers,
      driversAvailable,
      driversOnTrip,
      driversOffDuty,
      driversSuspended,
      tripsToday,
      tripsCompleted,
      activeTrips,
      fuelCostResult,
      maintenanceCostResult,
      revenueResult,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { deletedAt: null } }),
      prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE, deletedAt: null } }),
      prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP, deletedAt: null } }),
      prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP, deletedAt: null } }),
      prisma.vehicle.count({ where: { status: VehicleStatus.RETIRED, deletedAt: null } }),
      prisma.driver.count({ where: { deletedAt: null } }),
      prisma.driver.count({ where: { status: DriverStatus.AVAILABLE, deletedAt: null } }),
      prisma.driver.count({ where: { status: DriverStatus.ON_TRIP, deletedAt: null } }),
      prisma.driver.count({ where: { status: DriverStatus.OFF_DUTY, deletedAt: null } }),
      prisma.driver.count({ where: { status: DriverStatus.SUSPENDED, deletedAt: null } }),
      prisma.trip.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      prisma.trip.count({ where: { status: TripStatus.COMPLETED, deletedAt: null } }),
      prisma.trip.count({ where: { status: TripStatus.DISPATCHED, deletedAt: null } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true }, where: { deletedAt: null } }),
      prisma.maintenanceLog.aggregate({ _sum: { cost: true }, where: { deletedAt: null } }),
      prisma.trip.aggregate({
        _sum: { revenue: true },
        where: { status: TripStatus.COMPLETED, deletedAt: null },
      }),
    ]);

    const totalFuelCost = fuelCostResult._sum.cost ?? 0;
    const totalMaintenanceCost = maintenanceCostResult._sum.cost ?? 0;
    const totalRevenue = revenueResult._sum.revenue ?? 0;
    const totalExpenses = await prisma.expense.aggregate({ _sum: { amount: true }, where: { deletedAt: null } });
    const totalExpenseCost = totalExpenses._sum.amount ?? 0;
    const totalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;
    const profit = totalRevenue - totalCost;

    const fleetUtilization =
      totalVehicles > 0 ? Number(((vehiclesOnTrip / totalVehicles) * 100).toFixed(1)) : 0;

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
    await cacheSet(DASHBOARD_CACHE_KEY, kpis, DASHBOARD_CACHE_TTL);

    return kpis;
  }

  async getChartData(): Promise<any> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Group trips by day for the last 30 days
    const dailyTrips = await prisma.$queryRaw<any[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM trips
      WHERE "createdAt" >= ${last30Days} AND "deletedAt" IS NULL
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Monthly fuel cost trend
    const monthlyFuel = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC('month', date) as month, SUM(cost) as total_cost, SUM(quantity) as total_liters
      FROM fuel_logs
      WHERE "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;

    // Monthly maintenance cost trend
    const monthlyMaintenance = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC('month', date) as month, SUM(cost) as total_cost
      FROM maintenance_logs
      WHERE "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;

    // Expense category breakdown (pie chart)
    const expenseByCategory = await prisma.expense.groupBy({
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
