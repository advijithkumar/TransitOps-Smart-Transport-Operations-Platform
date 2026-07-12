import { Response, NextFunction } from "express";
import { ReportsService } from "../services/reports.service";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export class ReportsController {
  private service = new ReportsService();

  fleetUtilizationPDF = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const buffer = await this.service.generateFleetUtilizationPDF();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=fleet-utilization.pdf");
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  fleetUtilizationCSV = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csv = await this.service.generateFleetUtilizationCSV();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=fleet-utilization.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };

  fleetUtilizationExcel = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const buffer = await this.service.generateFleetUtilizationExcel();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=fleet-utilization.xlsx");
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}
