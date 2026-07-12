"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceController = void 0;
const maintenance_service_1 = require("../services/maintenance.service");
class MaintenanceController {
    service = new maintenance_service_1.MaintenanceService();
    create = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const log = await this.service.createLog(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Maintenance record created successfully",
                data: log,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const log = await this.service.updateLog(req.params.id, req.body, userId);
            res.status(200).json({
                success: true,
                message: "Maintenance record updated successfully",
                data: log,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const log = await this.service.getLogById(req.params.id);
            res.status(200).json({
                success: true,
                data: log,
            });
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            const filters = {
                status: req.query.status,
                vehicleId: req.query.vehicleId,
            };
            const logs = await this.service.getAllLogs(filters);
            res.status(200).json({
                success: true,
                data: logs,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            await this.service.deleteLog(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Maintenance log deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.MaintenanceController = MaintenanceController;
