"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
class DashboardController {
    service = new dashboard_service_1.DashboardService();
    getKPIs = async (req, res, next) => {
        try {
            const kpis = await this.service.getKPIs();
            res.status(200).json({ success: true, data: kpis });
        }
        catch (error) {
            next(error);
        }
    };
    getCharts = async (req, res, next) => {
        try {
            const charts = await this.service.getChartData();
            res.status(200).json({ success: true, data: charts });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DashboardController = DashboardController;
