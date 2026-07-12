"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const reports_service_1 = require("../services/reports.service");
class ReportsController {
    service = new reports_service_1.ReportsService();
    fleetUtilizationPDF = async (req, res, next) => {
        try {
            const buffer = await this.service.generateFleetUtilizationPDF();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=fleet-utilization.pdf");
            res.send(buffer);
        }
        catch (error) {
            next(error);
        }
    };
    fleetUtilizationCSV = async (req, res, next) => {
        try {
            const csv = await this.service.generateFleetUtilizationCSV();
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=fleet-utilization.csv");
            res.send(csv);
        }
        catch (error) {
            next(error);
        }
    };
    fleetUtilizationExcel = async (req, res, next) => {
        try {
            const buffer = await this.service.generateFleetUtilizationExcel();
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=fleet-utilization.xlsx");
            res.send(buffer);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ReportsController = ReportsController;
