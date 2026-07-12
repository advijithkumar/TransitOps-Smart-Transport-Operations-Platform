import { prisma } from "../../../config/database";
import { Vehicle, VehicleStatus } from "@prisma/client";

export interface VehicleFilters {
  status?: VehicleStatus;
  typeId?: string;
  regionId?: string;
}

export class VehiclesRepository {
  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        type: true,
        region: true,
        gpsDevice: true,
      },
    });
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null> {
    return prisma.vehicle.findFirst({
      where: { registrationNumber, deletedAt: null },
    });
  }

  async findAll(filters: VehicleFilters): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      where: {
        ...filters,
        deletedAt: null,
      },
      include: {
        type: true,
        region: true,
      },
    });
  }

  async create(data: any): Promise<Vehicle> {
    return prisma.vehicle.create({
      data,
      include: {
        type: true,
        region: true,
      },
    });
  }

  async update(id: string, data: any): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data,
      include: {
        type: true,
        region: true,
      },
    });
  }

  async delete(id: string): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
