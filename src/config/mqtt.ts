import mqtt from "mqtt";
import { logger } from "./logger";

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

export const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

mqttClient.on("connect", () => {
  logger.info("Connected to MQTT Broker successfully.");
  
  // Subscribe to vehicle telemetry and status topics
  mqttClient.subscribe("vehicle/+/telemetry", { qos: 1 }, (err: Error | null) => {
    if (err) {
      logger.error("MQTT subscription error for vehicle/+/telemetry:", err);
    } else {
      logger.info("Successfully subscribed to MQTT vehicle/+/telemetry channel");
    }
  });

  mqttClient.subscribe("vehicle/+/status", { qos: 1 }, (err: Error | null) => {
    if (err) {
      logger.error("MQTT subscription error for vehicle/+/status:", err);
    } else {
      logger.info("Successfully subscribed to MQTT vehicle/+/status channel");
    }
  });
});

mqttClient.on("error", (error: Error) => {
  logger.error("MQTT Broker Connection Error:", error);
});

mqttClient.on("reconnect", () => {
  logger.info("Attempting to reconnect to MQTT Broker...");
});
