import { FuelRepository, FuelFilters } from "../repositories/fuel.repository";
import { NotFoundError, BadRequestError } from "../../../shared/errors/app-error";
import { prisma } from "../../../config/database";
import { FuelLog, TripStatus } from "@prisma/client";
import { logger } from "../../../config/logger";
import { cacheDel } from "../../../config/redis";

export class FuelService {
  private repository = new FuelRepository();

  async createLog(data: any, userId?: string): Promise<FuelLog> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }

    if (data.tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: data.tripId, vehicleId: data.vehicleId, deletedAt: null },
      });
      if (!trip) {
        throw new BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
      }
    }

    const log = await this.repository.create(data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_FUEL_LOG",
        entity: "FUEL",
        entityId: log.id,
        details: { vehicleId: log.vehicleId, quantity: log.quantity, cost: log.cost },
      },
    });

    await cacheDel("dashboard_kpis");
    logger.info(`Fuel log created for vehicle ${log.vehicleId}.`);
    return log;
  }

  async updateLog(id: string, data: any, userId?: string): Promise<FuelLog> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundError("Fuel log not found.");
    }

    if (data.tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: data.tripId, vehicleId: log.vehicleId, deletedAt: null },
      });
      if (!trip) {
        throw new BadRequestError(`Trip with ID '${data.tripId}' is not associated with this vehicle.`);
      }
    }

    const updated = await this.repository.update(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_FUEL_LOG",
        entity: "FUEL",
        entityId: id,
        details: data,
      },
    });

    await cacheDel("dashboard_kpis");
    return updated;
  }

  async getLogById(id: string): Promise<FuelLog> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundError("Fuel log not found.");
    }
    return log;
  }

  async getAllLogs(filters: FuelFilters): Promise<FuelLog[]> {
    return this.repository.findAll(filters);
  }

  async deleteLog(id: string, userId?: string): Promise<void> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundError("Fuel log not found.");
    }

    await this.repository.delete(id);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_FUEL_LOG",
        entity: "FUEL",
        entityId: id,
      },
    });

    await cacheDel("dashboard_kpis");
  }

  async getFuelMetricsForVehicle(vehicleId: string): Promise<any> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }

    const fuelLogs = await prisma.fuelLog.findMany({
      where: { vehicleId, deletedAt: null },
    });

    // Sum fuel
    const totalQuantity = fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

    // Sum completed trip distances for calculations
    const trips = await prisma.trip.findMany({
      where: {
        vehicleId,
        status: TripStatus.COMPLETED,
        deletedAt: null,
      },
    });
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);

    // Metrics calculations
    const fuelEfficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0.0; // km/L
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0.0; // $/km

    return {
      vehicleId,
      registrationNumber: vehicle.registrationNumber,
      totalDistanceKm: totalDistance,
      totalQuantityLiters: totalQuantity,
      totalCost: totalCost,
      fuelEfficiencyKmL: Number(fuelEfficiency.toFixed(2)),
      costPerKm: Number(costPerKm.toFixed(2)),
    };
  }
}
