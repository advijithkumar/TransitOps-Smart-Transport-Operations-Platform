import { Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export class DashboardController {
  private service = new DashboardService();

  getKPIs = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const kpis = await this.service.getKPIs();
      res.status(200).json({ success: true, data: kpis });
    } catch (error) {
      next(error);
    }
  };

  getCharts = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const charts = await this.service.getChartData();
      res.status(200).json({ success: true, data: charts });
    } catch (error) {
      next(error);
    }
  };
}
