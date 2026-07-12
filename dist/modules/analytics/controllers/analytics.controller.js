"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
class AnalyticsController {
    service = new analytics_service_1.AnalyticsService();
    fleetUtilization = async (req, res, next) => {
        try {
            const data = await this.service.getFleetUtilization();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
    monthlyReport = async (req, res, next) => {
        try {
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;
            const data = await this.service.getMonthlyReport(year, month);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
    driverPerformance = async (req, res, next) => {
        try {
            const data = await this.service.getDriverPerformance();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AnalyticsController = AnalyticsController;
