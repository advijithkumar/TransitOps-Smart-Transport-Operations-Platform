import { MaintenanceRepository, MaintenanceFilters } from "../repositories/maintenance.repository";
import { NotFoundError, BadRequestError } from "../../../shared/errors/app-error";
import { prisma } from "../../../config/database";
import { MaintenanceLog, MaintenanceStatus, VehicleStatus, ExpenseCategory } from "@prisma/client";
import { logger } from "../../../config/logger";
import { cacheDel } from "../../../config/redis";

export class MaintenanceService {
  private repository = new MaintenanceRepository();

  async createLog(data: any, userId?: string): Promise<MaintenanceLog> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found.");
    }
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new BadRequestError("Cannot send vehicle to maintenance: Vehicle is currently ON_TRIP.");
    }

    const log = await prisma.$transaction(async (tx) => {
      // 1. If maintenance log status is not CANCELLED or COMPLETED immediately, set vehicle to IN_SHOP
      const setInShop = data.status !== MaintenanceStatus.COMPLETED && data.status !== MaintenanceStatus.CANCELLED;
      if (setInShop) {
        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: { status: VehicleStatus.IN_SHOP },
        });
      }

      // 2. Create the maintenance log
      const dateVal = new Date(data.date);
      const logRecord = await tx.maintenanceLog.create({
        data: {
          vehicleId: data.vehicleId,
          type: data.type,
          cost: data.cost,
          vendor: data.vendor,
          date: dateVal,
          status: data.status,
          description: data.description,
        },
        include: { vehicle: true },
      });

      // 3. If immediately created as COMPLETED, also log a Repair Expense
      if (data.status === MaintenanceStatus.COMPLETED && data.cost > 0) {
        await tx.expense.create({
          data: {
            vehicleId: data.vehicleId,
            category: ExpenseCategory.REPAIRS,
            amount: data.cost,
            date: dateVal,
            description: `Auto-Logged repair: ${data.type} by ${data.vendor}. Details: ${data.description || ""}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE_MAINTENANCE",
          entity: "MAINTENANCE",
          entityId: logRecord.id,
          details: { vehicleId: data.vehicleId, cost: data.cost },
        },
      });

      return logRecord;
    });

    await cacheDel("dashboard_kpis");
    logger.info(`Maintenance log created for vehicle ${data.vehicleId}.`);
    return log;
  }

  async updateLog(id: string, data: any, userId?: string): Promise<MaintenanceLog> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundError("Maintenance log not found.");
    }

    const updatedLog = await prisma.$transaction(async (tx) => {
      // Check if status is transitioning to closed (COMPLETED or CANCELLED) from open
      const wasOpen = log.status !== MaintenanceStatus.COMPLETED && log.status !== MaintenanceStatus.CANCELLED;
      const isClosing = data.status === MaintenanceStatus.COMPLETED || data.status === MaintenanceStatus.CANCELLED;

      if (wasOpen && isClosing) {
        // Automatically restore vehicle status to AVAILABLE
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });

        // Automatically log repairs cost in Expenses table if transitioning to COMPLETED
        if (data.status === MaintenanceStatus.COMPLETED && log.cost > 0) {
          await tx.expense.create({
            data: {
              vehicleId: log.vehicleId,
              category: ExpenseCategory.REPAIRS,
              amount: log.cost,
              date: log.date,
              description: `Auto-Logged repair: ${log.type} by ${log.vendor}. Status: Completed`,
            },
          });
        }
      }

      // If updating status back to open, make vehicle IN_SHOP again
      const isOpening = wasOpen === false && (data.status === MaintenanceStatus.SCHEDULED || data.status === MaintenanceStatus.IN_PROGRESS);
      if (isOpening) {
        const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
        if (vehicle && vehicle.status === VehicleStatus.ON_TRIP) {
          throw new BadRequestError("Cannot reopen maintenance: Vehicle is currently ON_TRIP.");
        }
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.IN_SHOP },
        });
      }

      const updateData = { ...data };
      if (data.date) {
        updateData.date = new Date(data.date);
      }

      const record = await tx.maintenanceLog.update({
        where: { id },
        data: updateData,
        include: { vehicle: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "UPDATE_MAINTENANCE",
          entity: "MAINTENANCE",
          entityId: id,
          details: data,
        },
      });

      return record;
    });

    await cacheDel("dashboard_kpis");
    logger.info(`Maintenance log ${id} updated.`);
    return updatedLog;
  }

  async getLogById(id: string): Promise<MaintenanceLog> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundError("Maintenance log not found.");
    }
    return log;
  }

  async getAllLogs(filters: MaintenanceFilters): Promise<MaintenanceLog[]> {
    return this.repository.findAll(filters);
  }

  async deleteLog(id: string, userId?: string): Promise<void> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundError("Maintenance log not found.");
    }

    await prisma.$transaction(async (tx) => {
      // If deleted log was open and holding the vehicle IN_SHOP, restore vehicle status
      const wasOpen = log.status !== MaintenanceStatus.COMPLETED && log.status !== MaintenanceStatus.CANCELLED;
      if (wasOpen) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      await tx.maintenanceLog.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DELETE_MAINTENANCE",
          entity: "MAINTENANCE",
          entityId: id,
        },
      });
    });

    await cacheDel("dashboard_kpis");
  }
}
