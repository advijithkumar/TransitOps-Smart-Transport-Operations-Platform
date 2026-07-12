"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttClient = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const logger_1 = require("./logger");
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
exports.mqttClient = mqtt_1.default.connect(MQTT_BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});
exports.mqttClient.on("connect", () => {
    logger_1.logger.info("Connected to MQTT Broker successfully.");
    // Subscribe to vehicle telemetry and status topics
    exports.mqttClient.subscribe("vehicle/+/telemetry", { qos: 1 }, (err) => {
        if (err) {
            logger_1.logger.error("MQTT subscription error for vehicle/+/telemetry:", err);
        }
        else {
            logger_1.logger.info("Successfully subscribed to MQTT vehicle/+/telemetry channel");
        }
    });
    exports.mqttClient.subscribe("vehicle/+/status", { qos: 1 }, (err) => {
        if (err) {
            logger_1.logger.error("MQTT subscription error for vehicle/+/status:", err);
        }
        else {
            logger_1.logger.info("Successfully subscribed to MQTT vehicle/+/status channel");
        }
    });
});
exports.mqttClient.on("error", (error) => {
    logger_1.logger.error("MQTT Broker Connection Error:", error);
});
exports.mqttClient.on("reconnect", () => {
    logger_1.logger.info("Attempting to reconnect to MQTT Broker...");
});
