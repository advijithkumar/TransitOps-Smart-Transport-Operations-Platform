import { mqttClient } from "../config/mqtt";
import { prisma } from "../config/database";
import { logger } from "../config/logger";
import { emitLiveLocation } from "../socket/socket.server";
import { cacheSet } from "../config/redis";

interface TelemetryPayload {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  timestamp?: string;
}

const updateLiveLocation = async (deviceId: string, payload: TelemetryPayload): Promise<void> => {
  try {
    const gpsDevice = await prisma.gpsDevice.findUnique({
      where: { deviceId },
    });

    if (!gpsDevice) {
      logger.warn(`MQTT telemetry: GPS device '${deviceId}' not registered.`);
      return;
    }

    const now = new Date();

    // Upsert live location using raw SQL for PostGIS geometry
    await prisma.$executeRaw`
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
    await prisma.$executeRaw`
      INSERT INTO location_history ("id", "gpsDeviceId", "latitude", "longitude", "speed", "heading", "altitude", "location", "timestamp")
      VALUES (gen_random_uuid(), ${gpsDevice.id}::uuid, ${payload.latitude}, ${payload.longitude}, ${payload.speed}, ${payload.heading}, ${payload.altitude}, ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326), NOW())
    `;

    // Update last connection time
    await prisma.gpsDevice.update({
      where: { id: gpsDevice.id },
      data: { lastConnectionTime: now },
    });

    // Cache latest position in Redis (TTL 5 minutes)
    await cacheSet(
      `gps:live:${deviceId}`,
      { ...payload, deviceId, vehicleId: gpsDevice.vehicleId },
      300
    );

    // Emit to Socket.IO
    emitLiveLocation(deviceId, {
      vehicleId: gpsDevice.vehicleId,
      ...payload,
      timestamp: now.toISOString(),
    });

    // Run geofence check (lightweight version: check if vehicle is inside any geofences)
    await checkGeofences(gpsDevice.id, gpsDevice.vehicleId, payload);
  } catch (error) {
    logger.error(`Error processing telemetry for device '${deviceId}':`, error);
  }
};

const checkGeofences = async (gpsDeviceId: string, _vehicleId: string, payload: TelemetryPayload): Promise<void> => {
  try {
    // PostGIS spatial query: find all geofences that contain this point
    const insideGeofences = await prisma.$queryRaw<{ id: string; name: string }[]>`
      SELECT id, name FROM geofences
      WHERE "deletedAt" IS NULL
        AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326))
    `;

    for (const geofence of insideGeofences) {
      // Log geofence entry event (simplified — no entry/exit state tracking in this version)
      await prisma.geofenceEvent.create({
        data: {
          geofenceId: geofence.id,
          gpsDeviceId,
          eventType: "ENTER",
        },
      });
      logger.info(`Geofence ENTER event: device=${gpsDeviceId} geofence=${geofence.name}`);
    }
  } catch (error) {
    logger.error("Geofence check error:", error);
  }
};

export const initMqttSubscriber = (): void => {
  mqttClient.on("message", (topic: string, message: Buffer) => {
    try {
      const topicParts = topic.split("/");
      // Expected pattern: vehicle/{deviceId}/telemetry OR vehicle/{deviceId}/status
      if (topicParts.length !== 3 || topicParts[0] !== "vehicle") return;

      const deviceId = topicParts[1];
      const channel = topicParts[2];
      const rawPayload = message.toString("utf-8");

      if (channel === "telemetry") {
        const payload: TelemetryPayload = JSON.parse(rawPayload);
        if (!payload.latitude || !payload.longitude) {
          logger.warn(`Invalid telemetry payload from device '${deviceId}': missing coordinates.`);
          return;
        }
        // Fire and forget (async processing)
        updateLiveLocation(deviceId, payload);
      } else if (channel === "status") {
        const statusPayload = JSON.parse(rawPayload);
        logger.info(`Device status update from '${deviceId}':`, statusPayload);
      }
    } catch (error) {
      logger.error(`Error parsing MQTT message on topic '${topic}':`, error);
    }
  });

  logger.info("MQTT subscriber handler registered.");
};
