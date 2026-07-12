import { prisma } from "../../../config/database";
import { Trip, TripStatus } from "@prisma/client";

export interface TripFilters {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
}

export class TripsRepository {
  async findById(id: string): Promise<Trip | null> {
    return prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async findAll(filters: TripFilters): Promise<Trip[]> {
    return prisma.trip.findMany({
      where: {
        ...filters,
        deletedAt: null,
      },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async create(data: any): Promise<Trip> {
    return prisma.trip.create({
      data,
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async update(id: string, data: any): Promise<Trip> {
    return prisma.trip.update({
      where: { id },
      data,
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async delete(id: string): Promise<Trip> {
    return prisma.trip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
