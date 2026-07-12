import { prisma } from "../../../config/database";
import { MaintenanceLog, MaintenanceStatus } from "@prisma/client";

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  vehicleId?: string;
}

export class MaintenanceRepository {
  async findById(id: string): Promise<MaintenanceLog | null> {
    return prisma.maintenanceLog.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: true,
      },
    });
  }

  async findAll(filters: MaintenanceFilters): Promise<MaintenanceLog[]> {
    return prisma.maintenanceLog.findMany({
      where: {
        ...filters,
        deletedAt: null,
      },
      include: {
        vehicle: true,
      },
    });
  }

  async create(data: any): Promise<MaintenanceLog> {
    return prisma.maintenanceLog.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        vehicle: true,
      },
    });
  }

  async update(id: string, data: any): Promise<MaintenanceLog> {
    const updateData = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    return prisma.maintenanceLog.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
      },
    });
  }

  async delete(id: string): Promise<MaintenanceLog> {
    return prisma.maintenanceLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
