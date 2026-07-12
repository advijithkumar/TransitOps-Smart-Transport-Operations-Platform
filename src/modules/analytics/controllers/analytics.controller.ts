import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export class AnalyticsController {
  private service = new AnalyticsService();

  fleetUtilization = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getFleetUtilization();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  monthlyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const data = await this.service.getMonthlyReport(year, month);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  driverPerformance = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getDriverPerformance();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
