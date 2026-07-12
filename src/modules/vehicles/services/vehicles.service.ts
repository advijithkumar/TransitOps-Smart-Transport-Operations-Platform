import { VehiclesRepository, VehicleFilters } from "../repositories/vehicles.repository";
import { ConflictError, NotFoundError, BadRequestError } from "../../../shared/errors/app-error";
import { prisma } from "../../../config/database";
import { Vehicle } from "@prisma/client";

export class VehiclesService {
  private repository = new VehiclesRepository();

  async createVehicle(data: any, userId?: string): Promise<Vehicle> {
    const existing = await this.repository.findByRegistrationNumber(data.registrationNumber);
    if (existing) {
      throw new ConflictError(`Vehicle with registration number '${data.registrationNumber}' already exists.`);
    }

    // Verify VehicleType exists
    const typeExists = await prisma.vehicleType.findUnique({
      where: { id: data.typeId },
    });
    if (!typeExists) {
      throw new BadRequestError(`Vehicle type with ID '${data.typeId}' not found.`);
    }

    // Verify Region exists
    if (data.regionId) {
      const regionExists = await prisma.region.findUnique({
        where: { id: data.regionId },
      });
      if (!regionExists) {
        throw new BadRequestError(`Region with ID '${data.regionId}' not found.`);
      }
    }

    const vehicle = await this.repository.create(data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_VEHICLE",
        entity: "VEHICLE",
        entityId: vehicle.id,
        details: { registrationNumber: vehicle.registrationNumber },
      },
    });

    return vehicle;
  }

  async updateVehicle(id: string, data: any, userId?: string): Promise<Vehicle> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }

    if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
      const existing = await this.repository.findByRegistrationNumber(data.registrationNumber);
      if (existing) {
        throw new ConflictError(`Vehicle with registration number '${data.registrationNumber}' already exists.`);
      }
    }

    if (data.typeId) {
      const typeExists = await prisma.vehicleType.findUnique({
        where: { id: data.typeId },
      });
      if (!typeExists) {
        throw new BadRequestError(`Vehicle type with ID '${data.typeId}' not found.`);
      }
    }

    if (data.regionId) {
      const regionExists = await prisma.region.findUnique({
        where: { id: data.regionId },
      });
      if (!regionExists) {
        throw new BadRequestError(`Region with ID '${data.regionId}' not found.`);
      }
    }

    const updated = await this.repository.update(id, data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_VEHICLE",
        entity: "VEHICLE",
        entityId: updated.id,
        details: data,
      },
    });

    return updated;
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }
    return vehicle;
  }

  async getAllVehicles(filters: VehicleFilters): Promise<Vehicle[]> {
    return this.repository.findAll(filters);
  }

  async deleteVehicle(id: string, userId?: string): Promise<void> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }

    await this.repository.delete(id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_VEHICLE",
        entity: "VEHICLE",
        entityId: id,
      },
    });
  }
}
