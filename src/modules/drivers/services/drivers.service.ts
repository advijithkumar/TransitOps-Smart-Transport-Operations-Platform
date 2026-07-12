import { DriversRepository, DriverFilters } from "../repositories/drivers.repository";
import { ConflictError, NotFoundError, BadRequestError } from "../../../shared/errors/app-error";
import { prisma } from "../../../config/database";
import { Driver } from "@prisma/client";

export class DriversService {
  private repository = new DriversRepository();

  async createDriver(data: any, userId?: string): Promise<Driver> {
    const existing = await this.repository.findByLicenseNumber(data.licenseNumber);
    if (existing) {
      throw new ConflictError(`Driver with license number '${data.licenseNumber}' already exists.`);
    }

    if (data.userId) {
      const userExists = await prisma.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!userExists) {
        throw new BadRequestError(`User with ID '${data.userId}' does not exist.`);
      }

      // Check if user is already associated with a driver
      const linkedDriver = await prisma.driver.findFirst({
        where: { userId: data.userId, deletedAt: null },
      });
      if (linkedDriver) {
        throw new ConflictError(`User is already linked to driver '${linkedDriver.name}'.`);
      }
    }

    const driver = await this.repository.create(data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_DRIVER",
        entity: "DRIVER",
        entityId: driver.id,
        details: { licenseNumber: driver.licenseNumber },
      },
    });

    return driver;
  }

  async updateDriver(id: string, data: any, userId?: string): Promise<Driver> {
    const driver = await this.repository.findById(id);
    if (!driver) {
      throw new NotFoundError("Driver not found.");
    }

    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existing = await this.repository.findByLicenseNumber(data.licenseNumber);
      if (existing) {
        throw new ConflictError(`Driver with license number '${data.licenseNumber}' already exists.`);
      }
    }

    if (data.userId && data.userId !== driver.userId) {
      const userExists = await prisma.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!userExists) {
        throw new BadRequestError(`User with ID '${data.userId}' does not exist.`);
      }

      const linkedDriver = await prisma.driver.findFirst({
        where: { userId: data.userId, deletedAt: null },
      });
      if (linkedDriver && linkedDriver.id !== id) {
        throw new ConflictError(`User is already linked to driver '${linkedDriver.name}'.`);
      }
    }

    const updated = await this.repository.update(id, data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_DRIVER",
        entity: "DRIVER",
        entityId: updated.id,
        details: data,
      },
    });

    return updated;
  }

  async getDriverById(id: string): Promise<Driver> {
    const driver = await this.repository.findById(id);
    if (!driver) {
      throw new NotFoundError("Driver not found.");
    }
    return driver;
  }

  async getAllDrivers(filters: DriverFilters): Promise<Driver[]> {
    return this.repository.findAll(filters);
  }

  async deleteDriver(id: string, userId?: string): Promise<void> {
    const driver = await this.repository.findById(id);
    if (!driver) {
      throw new NotFoundError("Driver not found.");
    }

    await this.repository.delete(id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_DRIVER",
        entity: "DRIVER",
        entityId: id,
      },
    });
  }
}
