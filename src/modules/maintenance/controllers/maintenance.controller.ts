import { Response, NextFunction } from "express";
import { MaintenanceService } from "../services/maintenance.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { MaintenanceStatus } from "@prisma/client";

export class MaintenanceController {
  private service = new MaintenanceService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const log = await this.service.createLog(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Maintenance record created successfully",
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const log = await this.service.updateLog(req.params.id, req.body, userId);
      res.status(200).json({
        success: true,
        message: "Maintenance record updated successfully",
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const log = await this.service.getLogById(req.params.id);
      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as MaintenanceStatus,
        vehicleId: req.query.vehicleId as string,
      };
      const logs = await this.service.getAllLogs(filters);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      await this.service.deleteLog(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Maintenance log deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
