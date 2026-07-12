import { prisma } from "../../../config/database";
import { TripStatus } from "@prisma/client";

export class AnalyticsService {
  async getFleetUtilization(): Promise<any> {
    const vehicles = await prisma.vehicle.findMany({
      where: { deletedAt: null },
      include: {
        trips: {
          where: { status: TripStatus.COMPLETED, deletedAt: null },
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

  async getMonthlyReport(year: number, month: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [trips, fuelLogs, expenses, maintenanceLogs] = await Promise.all([
      prisma.trip.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        include: { vehicle: true, driver: true },
      }),
      prisma.fuelLog.findMany({
        where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
      }),
      prisma.maintenanceLog.findMany({
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
        completed: trips.filter((t) => t.status === TripStatus.COMPLETED).length,
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

  async getDriverPerformance(): Promise<any> {
    const drivers = await prisma.driver.findMany({
      where: { deletedAt: null },
      include: {
        trips: {
          where: { status: TripStatus.COMPLETED, deletedAt: null },
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
      totalDistanceKm: Number(
        d.trips.reduce((sum, t) => sum + (t.actualDistance ?? 0), 0).toFixed(2)
      ),
      totalRevenue: Number(
        d.trips.reduce((sum, t) => sum + (t.revenue ?? 0), 0).toFixed(2)
      ),
    }));
  }
}
