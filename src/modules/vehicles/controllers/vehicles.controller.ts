import { Response, NextFunction } from "express";
import { VehiclesService } from "../services/vehicles.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { VehicleStatus } from "@prisma/client";

export class VehiclesController {
  private service = new VehiclesService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const vehicle = await this.service.createVehicle(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Vehicle registered successfully",
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const vehicle = await this.service.updateVehicle(req.params.id, req.body, userId);
      res.status(200).json({
        success: true,
        message: "Vehicle updated successfully",
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await this.service.getVehicleById(req.params.id);
      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as VehicleStatus,
        typeId: req.query.typeId as string,
        regionId: req.query.regionId as string,
      };
      const vehicles = await this.service.getAllVehicles(filters);
      res.status(200).json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      await this.service.deleteVehicle(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
