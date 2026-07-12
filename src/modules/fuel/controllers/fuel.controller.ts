import { Response, NextFunction } from "express";
import { FuelService } from "../services/fuel.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export class FuelController {
  private service = new FuelService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const log = await this.service.createLog(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Fuel log recorded successfully",
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
        message: "Fuel log updated successfully",
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
        vehicleId: req.query.vehicleId as string,
        tripId: req.query.tripId as string,
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
        message: "Fuel log deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await this.service.getFuelMetricsForVehicle(req.params.vehicleId);
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  };
}
