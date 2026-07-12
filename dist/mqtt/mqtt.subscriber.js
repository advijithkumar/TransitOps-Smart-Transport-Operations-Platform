"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMqttSubscriber = void 0;
const mqtt_1 = require("../config/mqtt");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const socket_server_1 = require("../socket/socket.server");
const redis_1 = require("../config/redis");
const updateLiveLocation = async (deviceId, payload) => {
    try {
        const gpsDevice = await database_1.prisma.gpsDevice.findUnique({
            where: { deviceId },
        });
        if (!gpsDevice) {
            logger_1.logger.warn(`MQTT telemetry: GPS device '${deviceId}' not registered.`);
            return;
        }
        const now = new Date();
        // Upsert live location using raw SQL for PostGIS geometry
        await database_1.prisma.$executeRaw `
      INSERT INTO live_locations ("id", "gpsDeviceId", "latitude", "longitude", "speed", "heading", "altitude", "location", "updatedAt")
      VALUES (gen_random_uuid(), ${gpsDevice.id}::uuid, ${payload.latitude}, ${payload.longitude}, ${payload.speed}, ${payload.heading}, ${payload.altitude}, ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326), NOW())
      ON CONFLICT ("gpsDeviceId") DO UPDATE
      SET "latitude" = ${payload.latitude},
          "longitude" = ${payload.longitude},
          "speed" = ${payload.speed},
          "heading" = ${payload.heading},
          "altitude" = ${payload.altitude},
          "location" = ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326),
          "updatedAt" = NOW()
    `;
        // Append to history
        await database_1.prisma.$executeRaw `
      INSERT INTO location_history ("id", "gpsDeviceId", "latitude", "longitude", "speed", "heading", "altitude", "location", "timestamp")
      VALUES (gen_random_uuid(), ${gpsDevice.id}::uuid, ${payload.latitude}, ${payload.longitude}, ${payload.speed}, ${payload.heading}, ${payload.altitude}, ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326), NOW())
    `;
        // Update last connection time
        await database_1.prisma.gpsDevice.update({
            where: { id: gpsDevice.id },
            data: { lastConnectionTime: now },
        });
        // Cache latest position in Redis (TTL 5 minutes)
        await (0, redis_1.cacheSet)(`gps:live:${deviceId}`, { ...payload, deviceId, vehicleId: gpsDevice.vehicleId }, 300);
        // Emit to Socket.IO
        (0, socket_server_1.emitLiveLocation)(deviceId, {
            vehicleId: gpsDevice.vehicleId,
            ...payload,
            timestamp: now.toISOString(),
        });
        // Run geofence check (lightweight version: check if vehicle is inside any geofences)
        await checkGeofences(gpsDevice.id, gpsDevice.vehicleId, payload);
    }
    catch (error) {
        logger_1.logger.error(`Error processing telemetry for device '${deviceId}':`, error);
    }
};
const checkGeofences = async (gpsDeviceId, _vehicleId, payload) => {
    try {
        // PostGIS spatial query: find all geofences that contain this point
        const insideGeofences = await database_1.prisma.$queryRaw `
      SELECT id, name FROM geofences
      WHERE "deletedAt" IS NULL
        AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326))
    `;
        for (const geofence of insideGeofences) {
            // Log geofence entry event (simplified — no entry/exit state tracking in this version)
            await database_1.prisma.geofenceEvent.create({
                data: {
                    geofenceId: geofence.id,
                    gpsDeviceId,
                    eventType: "ENTER",
                },
            });
            logger_1.logger.info(`Geofence ENTER event: device=${gpsDeviceId} geofence=${geofence.name}`);
        }
    }
    catch (error) {
        logger_1.logger.error("Geofence check error:", error);
    }
};
const initMqttSubscriber = () => {
    mqtt_1.mqttClient.on("message", (topic, message) => {
        try {
            const topicParts = topic.split("/");
            // Expected pattern: vehicle/{deviceId}/telemetry OR vehicle/{deviceId}/status
            if (topicParts.length !== 3 || topicParts[0] !== "vehicle")
                return;
            const deviceId = topicParts[1];
            const channel = topicParts[2];
            const rawPayload = message.toString("utf-8");
            if (channel === "telemetry") {
                const payload = JSON.parse(rawPayload);
                if (!payload.latitude || !payload.longitude) {
                    logger_1.logger.warn(`Invalid telemetry payload from device '${deviceId}': missing coordinates.`);
                    return;
                }
                // Fire and forget (async processing)
                updateLiveLocation(deviceId, payload);
            }
            else if (channel === "status") {
                const statusPayload = JSON.parse(rawPayload);
                logger_1.logger.info(`Device status update from '${deviceId}':`, statusPayload);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error parsing MQTT message on topic '${topic}':`, error);
        }
    });
    logger_1.logger.info("MQTT subscriber handler registered.");
};
exports.initMqttSubscriber = initMqttSubscriber;
