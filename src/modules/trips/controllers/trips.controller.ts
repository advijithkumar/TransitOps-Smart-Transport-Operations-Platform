import { Response, NextFunction } from "express";
import { TripsService } from "../services/trips.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { TripStatus } from "@prisma/client";

export class TripsController {
  private service = new TripsService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const trip = await this.service.createTrip(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Trip draft created successfully",
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  dispatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const trip = await this.service.dispatchTrip(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Trip dispatched successfully",
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const trip = await this.service.completeTrip(req.params.id, req.body, userId);
      res.status(200).json({
        success: true,
        message: "Trip completed successfully",
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const trip = await this.service.cancelTrip(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Trip cancelled successfully",
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trip = await this.service.getTripById(req.params.id);
      res.status(200).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as TripStatus,
        vehicleId: req.query.vehicleId as string,
        driverId: req.query.driverId as string,
      };
      const trips = await this.service.getAllTrips(filters);
      res.status(200).json({
        success: true,
        data: trips,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      await this.service.deleteTrip(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: "Trip deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
