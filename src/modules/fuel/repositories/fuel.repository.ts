import { prisma } from "../../../config/database";
import { FuelLog } from "@prisma/client";

export interface FuelFilters {
  vehicleId?: string;
  tripId?: string;
}

export class FuelRepository {
  async findById(id: string): Promise<FuelLog | null> {
    return prisma.fuelLog.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async findAll(filters: FuelFilters): Promise<FuelLog[]> {
    return prisma.fuelLog.findMany({
      where: {
        ...filters,
        deletedAt: null,
      },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async create(data: any): Promise<FuelLog> {
    return prisma.fuelLog.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async update(id: string, data: any): Promise<FuelLog> {
    const updateData = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    return prisma.fuelLog.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async delete(id: string): Promise<FuelLog> {
    return prisma.fuelLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
