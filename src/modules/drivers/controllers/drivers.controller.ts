import { Response, NextFunction } from "express";
import { DriversService } from "../services/drivers.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { DriverStatus } from "@prisma/client";

export class DriversController {
  private service = new DriversService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const driver = await this.service.createDriver(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Driver registered successfully",
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const driver = await this.service.updateDriver(req.params.id, req.body, userId);
      res.status(200).json({
        success: true,
        message: "Driver profile updated successfully",
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = await this.service.getDriverById(req.params.id);
      res.status(200).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as DriverStatus,
      };
      const drivers = await this.service.getAllDrivers(filters);
      res.status(200).json({
        success: true,
        data: drivers,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      await this.service.deleteDriver(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Driver deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
