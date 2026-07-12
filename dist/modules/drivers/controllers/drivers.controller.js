"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversController = void 0;
const drivers_service_1 = require("../services/drivers.service");
class DriversController {
    service = new drivers_service_1.DriversService();
    create = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const driver = await this.service.createDriver(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Driver registered successfully",
                data: driver,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const driver = await this.service.updateDriver(req.params.id, req.body, userId);
            res.status(200).json({
                success: true,
                message: "Driver profile updated successfully",
                data: driver,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const driver = await this.service.getDriverById(req.params.id);
            res.status(200).json({
                success: true,
                data: driver,
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
            };
            const drivers = await this.service.getAllDrivers(filters);
            res.status(200).json({
                success: true,
                data: drivers,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            await this.service.deleteDriver(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Driver deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DriversController = DriversController;
