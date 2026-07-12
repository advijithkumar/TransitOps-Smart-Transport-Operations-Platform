import { prisma } from "../../../config/database";
import { Driver, DriverStatus } from "@prisma/client";

export interface DriverFilters {
  status?: DriverStatus;
}

export class DriversRepository {
  async findById(id: string): Promise<Driver | null> {
    return prisma.driver.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
      },
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    return prisma.driver.findFirst({
      where: { licenseNumber, deletedAt: null },
    });
  }

  async findAll(filters: DriverFilters): Promise<Driver[]> {
    return prisma.driver.findMany({
      where: {
        ...filters,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });
  }

  async create(data: any): Promise<Driver> {
    return prisma.driver.create({
      data: {
        ...data,
        licenseExpiry: new Date(data.licenseExpiry),
      },
    });
  }

  async update(id: string, data: any): Promise<Driver> {
    const updateData = { ...data };
    if (data.licenseExpiry) {
      updateData.licenseExpiry = new Date(data.licenseExpiry);
    }
    return prisma.driver.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<Driver> {
    return prisma.driver.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
