"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsController = void 0;
const trips_service_1 = require("../services/trips.service");
class TripsController {
    service = new trips_service_1.TripsService();
    create = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const trip = await this.service.createTrip(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Trip draft created successfully",
                data: trip,
            });
        }
        catch (error) {
            next(error);
        }
    };
    dispatch = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const trip = await this.service.dispatchTrip(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Trip dispatched successfully",
                data: trip,
            });
        }
        catch (error) {
            next(error);
        }
    };
    complete = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const trip = await this.service.completeTrip(req.params.id, req.body, userId);
            res.status(200).json({
                success: true,
                message: "Trip completed successfully",
                data: trip,
            });
        }
        catch (error) {
            next(error);
        }
    };
    cancel = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const trip = await this.service.cancelTrip(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Trip cancelled successfully",
                data: trip,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const trip = await this.service.getTripById(req.params.id);
            res.status(200).json({
                success: true,
                data: trip,
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
                driverId: req.query.driverId,
            };
            const trips = await this.service.getAllTrips(filters);
            res.status(200).json({
                success: true,
                data: trips,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            await this.service.deleteTrip(req.params.id, userId);
            res.status(200).json({
                success: true,
                message: "Trip deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.TripsController = TripsController;
