"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelController = void 0;
const fuel_service_1 = require("../services/fuel.service");
class FuelController {
    service = new fuel_service_1.FuelService();
    create = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const log = await this.service.createLog(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Fuel log recorded successfully",
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
                message: "Fuel log updated successfully",
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
                vehicleId: req.query.vehicleId,
                tripId: req.query.tripId,
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
                message: "Fuel log deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
    getMetrics = async (req, res, next) => {
        try {
            const metrics = await this.service.getFuelMetricsForVehicle(req.params.vehicleId);
            res.status(200).json({
                success: true,
                data: metrics,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.FuelController = FuelController;
