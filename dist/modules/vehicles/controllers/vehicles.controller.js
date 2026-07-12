"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesController = void 0;
const vehicles_service_1 = require("../services/vehicles.service");
class VehiclesController {
    service = new vehicles_service_1.VehiclesService();
    create = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const vehicle = await this.service.createVehicle(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Vehicle registered successfully",
                data: vehicle,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const vehicle = await this.service.updateVehicle(req.params.id, req.body, userId);
            res.status(200).json({
                success: true,
                message: "Vehicle updated successfully",
                data: vehicle,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const vehicle = await this.service.getVehicleById(req.params.id);
            res.status(200).json({
                success: true,
                data: vehicle,
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
                typeId: req.query.typeId,
                regionId: req.query.regionId,
            };
            const vehicles = await this.service.getAllVehicles(filters);
            res.status(200).json({
                success: true,
                data: vehicles,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            await this.service.deleteVehicle(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Vehicle deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.VehiclesController = VehiclesController;
