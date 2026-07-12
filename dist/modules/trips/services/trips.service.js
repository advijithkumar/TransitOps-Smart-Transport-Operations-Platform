"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsService = void 0;
const trips_repository_1 = require("../repositories/trips.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
const logger_1 = require("../../../config/logger");
const redis_1 = require("../../../config/redis");
class TripsService {
    repository = new trips_repository_1.TripsRepository();
    async createTrip(data, userId) {
        // 1. Verify vehicle existence and suitability
        const vehicle = await database_1.prisma.vehicle.findFirst({
            where: { id: data.vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw new app_error_1.NotFoundError("Vehicle not found.");
        }
        if (vehicle.status === client_1.VehicleStatus.RETIRED) {
            throw new app_error_1.BadRequestError("Cannot assign trip: Vehicle is retired.");
        }
        if (vehicle.status === client_1.VehicleStatus.IN_SHOP) {
            throw new app_error_1.BadRequestError("Cannot assign trip: Vehicle is in maintenance (in shop).");
        }
        // 2. Verify driver existence and suitability
        const driver = await database_1.prisma.driver.findFirst({
            where: { id: data.driverId, deletedAt: null },
        });
        if (!driver) {
            throw new app_error_1.NotFoundError("Driver not found.");
        }
        if (driver.status === client_1.DriverStatus.SUSPENDED) {
            throw new app_error_1.BadRequestError("Cannot assign trip: Driver is suspended.");
        }
        const isLicenseExpired = new Date(driver.licenseExpiry).getTime() < Date.now();
        if (isLicenseExpired) {
            throw new app_error_1.BadRequestError("Cannot assign trip: Driver's license has expired.");
        }
        // 3. Verify vehicle capacity limits
        if (vehicle.maxCapacity < data.cargoWeight) {
            throw new app_error_1.BadRequestError(`Cargo weight (${data.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxCapacity} kg).`);
        }
        const trip = await this.repository.create({
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            source: data.source,
            destination: data.destination,
            cargoWeight: data.cargoWeight,
            plannedDistance: data.plannedDistance,
            status: client_1.TripStatus.DRAFT, // Always starts as draft
        });
        // Audit log
        await database_1.prisma.auditLog.create({
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
    async dispatchTrip(id, userId) {
        const trip = await this.repository.findById(id);
        if (!trip) {
            throw new app_error_1.NotFoundError("Trip not found.");
        }
        if (trip.status !== client_1.TripStatus.DRAFT) {
            throw new app_error_1.BadRequestError(`Cannot dispatch a trip that is in '${trip.status}' status.`);
        }
        // Reload vehicle and driver status
        const vehicle = await database_1.prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
        const driver = await database_1.prisma.driver.findUnique({ where: { id: trip.driverId } });
        if (!vehicle || vehicle.deletedAt)
            throw new app_error_1.NotFoundError("Vehicle not found.");
        if (!driver || driver.deletedAt)
            throw new app_error_1.NotFoundError("Driver not found.");
        if (vehicle.status !== client_1.VehicleStatus.AVAILABLE) {
            throw new app_error_1.BadRequestError(`Vehicle is not available. Current status: ${vehicle.status}`);
        }
        if (driver.status !== client_1.DriverStatus.AVAILABLE) {
            throw new app_error_1.BadRequestError(`Driver is not available. Current status: ${driver.status}`);
        }
        // Ensure license didn't expire since draft creation
        const isLicenseExpired = new Date(driver.licenseExpiry).getTime() < Date.now();
        if (isLicenseExpired) {
            throw new app_error_1.BadRequestError("Cannot dispatch: Driver's license has expired.");
        }
        // Execute atomic dispatch transaction
        const updatedTrip = await database_1.prisma.$transaction(async (tx) => {
            // Update statuses
            await tx.vehicle.update({
                where: { id: vehicle.id },
                data: { status: client_1.VehicleStatus.ON_TRIP },
            });
            await tx.driver.update({
                where: { id: driver.id },
                data: { status: client_1.DriverStatus.ON_TRIP },
            });
            const updated = await tx.trip.update({
                where: { id: trip.id },
                data: { status: client_1.TripStatus.DISPATCHED },
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
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Trip ${id} successfully dispatched.`);
        return updatedTrip;
    }
    async completeTrip(id, completionData, userId) {
        const trip = await this.repository.findById(id);
        if (!trip) {
            throw new app_error_1.NotFoundError("Trip not found.");
        }
        if (trip.status !== client_1.TripStatus.DISPATCHED) {
            throw new app_error_1.BadRequestError("Only dispatched trips can be completed.");
        }
        const vehicle = await database_1.prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
        if (!vehicle)
            throw new app_error_1.NotFoundError("Vehicle not found.");
        if (completionData.finalOdometer < vehicle.odometer) {
            throw new app_error_1.BadRequestError(`Final odometer reading (${completionData.finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km).`);
        }
        // Execute completion transaction
        const completedTrip = await database_1.prisma.$transaction(async (tx) => {
            // 1. Release vehicle and update odometer
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: {
                    status: client_1.VehicleStatus.AVAILABLE,
                    odometer: completionData.finalOdometer,
                },
            });
            // 2. Release driver
            await tx.driver.update({
                where: { id: trip.driverId },
                data: { status: client_1.DriverStatus.AVAILABLE },
            });
            // 3. Update trip record details
            const updated = await tx.trip.update({
                where: { id: trip.id },
                data: {
                    status: client_1.TripStatus.COMPLETED,
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
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Trip ${id} completed successfully.`);
        return completedTrip;
    }
    async cancelTrip(id, userId) {
        const trip = await this.repository.findById(id);
        if (!trip) {
            throw new app_error_1.NotFoundError("Trip not found.");
        }
        if (trip.status === client_1.TripStatus.COMPLETED || trip.status === client_1.TripStatus.CANCELLED) {
            throw new app_error_1.BadRequestError(`Cannot cancel a trip that is already ${trip.status}.`);
        }
        const cancelledTrip = await database_1.prisma.$transaction(async (tx) => {
            // If the trip was active, release vehicle & driver resources
            if (trip.status === client_1.TripStatus.DISPATCHED) {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: client_1.VehicleStatus.AVAILABLE },
                });
                await tx.driver.update({
                    where: { id: trip.driverId },
                    data: { status: client_1.DriverStatus.AVAILABLE },
                });
            }
            const updated = await tx.trip.update({
                where: { id: trip.id },
                data: { status: client_1.TripStatus.CANCELLED },
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
        await (0, redis_1.cacheDel)("dashboard_kpis");
        logger_1.logger.info(`Trip ${id} was cancelled.`);
        return cancelledTrip;
    }
    async getTripById(id) {
        const trip = await this.repository.findById(id);
        if (!trip) {
            throw new app_error_1.NotFoundError("Trip not found.");
        }
        return trip;
    }
    async getAllTrips(filters) {
        return this.repository.findAll(filters);
    }
    async deleteTrip(id, userId) {
        const trip = await this.repository.findById(id);
        if (!trip) {
            throw new app_error_1.NotFoundError("Trip not found.");
        }
        await this.repository.delete(id);
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action: "DELETE_TRIP",
                entity: "TRIP",
                entityId: id,
            },
        });
    }
}
exports.TripsService = TripsService;
