import { TripsRepository, TripFilters } from "../repositories/trips.repository";
import { NotFoundError, BadRequestError } from "../../../shared/errors/app-error";
import { prisma } from "../../../config/database";
import { Trip, TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";
import { logger } from "../../../config/logger";
import { cacheDel } from "../../../config/redis";

export class TripsService {
  private repository = new TripsRepository();

  async createTrip(data: any, userId?: string): Promise<Trip> {
    // 1. Verify vehicle existence and suitability
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }
    if (vehicle.status === VehicleStatus.RETIRED) {
      throw new BadRequestError("Cannot assign trip: Vehicle is retired.");
    }
    if (vehicle.status === VehicleStatus.IN_SHOP) {
      throw new BadRequestError("Cannot assign trip: Vehicle is in maintenance (in shop).");
    }

    // 2. Verify driver existence and suitability
    const driver = await prisma.driver.findFirst({
      where: { id: data.driverId, deletedAt: null },
    });
    if (!driver) {
      throw new NotFoundError("Driver not found.");
    }
    if (driver.status === DriverStatus.SUSPENDED) {
      throw new BadRequestError("Cannot assign trip: Driver is suspended.");
    }
    
    const isLicenseExpired = new Date(driver.licenseExpiry).getTime() < Date.now();
    if (isLicenseExpired) {
      throw new BadRequestError("Cannot assign trip: Driver's license has expired.");
    }

    // 3. Verify vehicle capacity limits
    if (vehicle.maxCapacity < data.cargoWeight) {
      throw new BadRequestError(
        `Cargo weight (${data.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxCapacity} kg).`
      );
    }

    const trip = await this.repository.create({
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      source: data.source,
      destination: data.destination,
      cargoWeight: data.cargoWeight,
      plannedDistance: data.plannedDistance,
      status: TripStatus.DRAFT, // Always starts as draft
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_TRIP",
        entity: "TRIP",
        entityId: trip.id,
        details: { vehicleId: trip.vehicleId, driverId: trip.driverId },
      },
    });

    return trip;
  }

  async dispatchTrip(id: string, userId?: string): Promise<Trip> {
    const trip = await this.repository.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found.");
    }

    if (trip.status !== TripStatus.DRAFT) {
      throw new BadRequestError(`Cannot dispatch a trip that is in '${trip.status}' status.`);
    }

    // Reload vehicle and driver status
    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });

    if (!vehicle || vehicle.deletedAt) throw new NotFoundError("Vehicle not found.");
    if (!driver || driver.deletedAt) throw new NotFoundError("Driver not found.");

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestError(`Vehicle is not available. Current status: ${vehicle.status}`);
    }
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new BadRequestError(`Driver is not available. Current status: ${driver.status}`);
    }

    // Ensure license didn't expire since draft creation
    const isLicenseExpired = new Date(driver.licenseExpiry).getTime() < Date.now();
    if (isLicenseExpired) {
      throw new BadRequestError("Cannot dispatch: Driver's license has expired.");
    }

    // Execute atomic dispatch transaction
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Update statuses
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.ON_TRIP },
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ON_TRIP },
      });

      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: { status: TripStatus.DISPATCHED },
        include: { vehicle: true, driver: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DISPATCH_TRIP",
          entity: "TRIP",
          entityId: trip.id,
        },
      });

      return updated;
    });

    // Invalidate dashboard analytics cache
    await cacheDel("dashboard_kpis");

    logger.info(`Trip ${id} successfully dispatched.`);
    return updatedTrip;
  }

  async completeTrip(id: string, completionData: any, userId?: string): Promise<Trip> {
    const trip = await this.repository.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found.");
    }

    if (trip.status !== TripStatus.DISPATCHED) {
      throw new BadRequestError("Only dispatched trips can be completed.");
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
    if (!vehicle) throw new NotFoundError("Vehicle not found.");

    if (completionData.finalOdometer < vehicle.odometer) {
      throw new BadRequestError(
        `Final odometer reading (${completionData.finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km).`
      );
    }

    // Execute completion transaction
    const completedTrip = await prisma.$transaction(async (tx) => {
      // 1. Release vehicle and update odometer
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: VehicleStatus.AVAILABLE,
          odometer: completionData.finalOdometer,
        },
      });

      // 2. Release driver
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });

      // 3. Update trip record details
      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          status: TripStatus.COMPLETED,
          actualDistance: completionData.actualDistance,
          revenue: completionData.revenue,
          fuelUsed: completionData.fuelUsed,
          finalOdometer: completionData.finalOdometer,
        },
        include: { vehicle: true, driver: true },
      });

      // 4. Record a default Fuel Log matching this trip's completion telemetry (with cost estimate: e.g., $1.3 per Liter)
      const calculatedCost = completionData.fuelUsed * 1.35;
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          quantity: completionData.fuelUsed,
          cost: calculatedCost,
          station: "Auto-Logged (Trip Delivery)",
          date: new Date(),
        },
      });

      // 5. Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: "COMPLETE_TRIP",
          entity: "TRIP",
          entityId: trip.id,
          details: completionData,
        },
      });

      return updated;
    });

    // Invalidate dashboard analytics cache
    await cacheDel("dashboard_kpis");

    logger.info(`Trip ${id} completed successfully.`);
    return completedTrip;
  }

  async cancelTrip(id: string, userId?: string): Promise<Trip> {
    const trip = await this.repository.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found.");
    }

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new BadRequestError(`Cannot cancel a trip that is already ${trip.status}.`);
    }

    const cancelledTrip = await prisma.$transaction(async (tx) => {
      // If the trip was active, release vehicle & driver resources
      if (trip.status === TripStatus.DISPATCHED) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }

      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: { status: TripStatus.CANCELLED },
        include: { vehicle: true, driver: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "CANCEL_TRIP",
          entity: "TRIP",
          entityId: trip.id,
        },
      });

      return updated;
    });

    // Invalidate dashboard cache
    await cacheDel("dashboard_kpis");

    logger.info(`Trip ${id} was cancelled.`);
    return cancelledTrip;
  }

  async getTripById(id: string): Promise<Trip> {
    const trip = await this.repository.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found.");
    }
    return trip;
  }

  async getAllTrips(filters: TripFilters): Promise<Trip[]> {
    return this.repository.findAll(filters);
  }

  async deleteTrip(id: string, userId?: string): Promise<void> {
    const trip = await this.repository.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found.");
    }

    await this.repository.delete(id);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_TRIP",
        entity: "TRIP",
        entityId: id,
      },
    });
  }
}
