# TransitOps Smart Transport Operations Platform
## Server Node & API Documentation Reference Guide

This document contains a comprehensive operational guide for the Node.js server and details the entire REST API surface, real-time WebSocket events, MQTT telemetry channels, and database configurations.

---

## 🖥️ Server Node Architecture & Bootstrap Flow

The TransitOps backend is built as a modular enterprise API server using **Node.js, Express, and TypeScript**. It integrates multiple communication channels (HTTP/REST, WebSockets, and MQTT) backed by a PostgreSQL database and a Redis/BullMQ task queue.

### Server Bootstrap Order (`src/server.ts`)
1. **Database initialization**: Connects via `PrismaClient` to PostgreSQL (with PostGIS spatial extensions).
2. **Cache layer initialization**: Authenticates connection to Redis (verifying setup with a `ping` command).
3. **HTTP Server creation**: Wraps the Express application.
4. **WebSocket Server creation**: Integrates `Socket.IO` onto the HTTP server, enforcing JWT verification for all client connections.
5. **MQTT Telemetry subscriber registration**: Connects to the Eclipse Mosquitto MQTT broker and registers subscribers for live vehicle tracking data.
6. **Background Task Workers launch**: Starts BullMQ workers (`email-dispatch`, `license-expiry-check`, `maintenance-reminder`, `report-generation`).
7. **Listener launch**: Listens on the configured port (default `3000`).

---

## ⚙️ Environment Configuration

Setup your `.env` file in the project root:

```env
# Server Config
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# PostgreSQL Database (Host port mapped to 5433 to avoid local 5432 conflict)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/transitops?schema=public"

# Redis Cache & Queue
REDIS_URL="redis://localhost:6379"

# MQTT Broker (GPS telemetry data)
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME=transitops_broker
MQTT_PASSWORD=transitops_secure_pass

# JWT Parameters
JWT_ACCESS_SECRET="transitops-super-secret-access-token-key-2026"
JWT_REFRESH_SECRET="transitops-super-secret-refresh-token-key-2026"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Nodemailer SMTP Configuration
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="transitops@ethereal.email"
SMTP_PASS="transitops_pass"
EMAIL_FROM="TransitOps Alerts <alerts@transitops.com>"

# MinIO / AWS S3 Storage Setup
S3_ENDPOINT="localhost"
S3_PORT=9000
S3_USE_SSL=false
S3_ACCESS_KEY="minio_admin"
S3_SECRET_KEY="minio_admin_secret"
S3_BUCKET_NAME="transitops-documents"
```

---

## 🔑 Authentication & RBAC

All API requests (except public auth endpoints and `/health`) require an `Authorization` header containing a valid Bearer JWT:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Roles and Permissions
* **ADMIN**: Full system capabilities.
* **FLEET_MANAGER**: Manage vehicles, drivers, expenses, fuel logs, and view operations dashboard.
* **DISPATCHER**: Manage trips (Draft, Dispatch, Complete, Cancel).
* **DRIVER**: Access assigned trips and self status updates.
* **SAFETY_OFFICER**: Review fleet telemetry and safety score alerts.
* **FINANCIAL_ANALYST**: Read-only access to operational logs, expenses, fuel, and reports.

---

## 📡 IoT Telemetry (MQTT)

The server subscribes to telemetry payloads from registered hardware tracking devices on the following topics:

### 1. Topic: `vehicle/{deviceId}/telemetry`
Sends live location updates.
* **QoS**: `1`
* **JSON Payload Format**:
  ```json
  {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "speed": 65.4,
    "heading": 180.0,
    "altitude": 10.5,
    "timestamp": "2026-07-12T13:22:36Z"
  }
  ```
* **Server Action**: On message receipt, the server updates `live_locations` and pushes a historical log to `location_history` (using PostGIS geometry spatial features). The update is cached in Redis (5 min TTL) and broadcasted to WebSockets.

### 2. Topic: `vehicle/{deviceId}/status`
* **Payload**: `{"status": "ACTIVE" | "INACTIVE"}`

---

## 🔄 Real-time WebSockets (Socket.IO)

The WebSocket server runs at `ws://localhost:3000` with JWT Authentication middleware (pass token in `auth` or headers).

### Rooms Joined on Connect:
* `role:<USER_ROLE>` (e.g., `role:FLEET_MANAGER`)
* `user:<USER_ID>`
* `fleet-operations` (joined automatically by ADMIN, FLEET_MANAGER, and DISPATCHER)

### Server-Emitted Events:
* **`gps:location-update`** (Room: `fleet-operations`):
  ```json
  { "deviceId": "dev-001", "vehicleId": "uuid-here", "latitude": 40.7, "longitude": -74.0, "speed": 65.4, "heading": 180 }
  ```
* **`trip:status-change`** (Room: `fleet-operations`):
  ```json
  { "tripId": "uuid", "status": "DISPATCHED", "vehicleId": "uuid", "driverId": "uuid" }
  ```
* **`system:alert`** (Room: `user:<userId>`):
  ```json
  { "title": "License Expiry Reminder", "message": "Your driver license expires in 5 days." }
  ```
* **`dashboard:kpi-update`** (Room: `fleet-operations`):
  Emits live fleet KPI status blocks regularly.

---

## 🛠️ API Endpoint Reference

All endpoints are prefixed with `/api`.

### 1. Authentication (`/auth`)

* **`POST /auth/register`**: Register a new user.
  * *Request Body*: `{ "email", "password", "name", "phone", "roleName" }`
* **`POST /auth/login`**: Authenticate credentials.
  * *Request Body*: `{ "email", "password" }`
  * *Response*: `{ "accessToken", "refreshToken", "user" }`
* **`POST /auth/refresh`**: Get a new access token.
  * *Request Body*: `{ "token" }` (Uses Refresh Token)
* **`POST /auth/logout`**: Terminate current session.
  * *Headers*: Bearer token (will be added to the Redis blacklist).
* **`POST /auth/forgot-password`**: Initiate password reset.
  * *Request Body*: `{ "email" }`
* **`POST /auth/reset-password`**: Submit password change.
  * *Request Body*: `{ "token", "newPassword" }`

### 2. Vehicle Management (`/vehicles`)

* **`POST /vehicles`**: Register a new vehicle.
  * *Request Body*: `{ "registrationNumber", "name", "model", "typeId", "maxCapacity", "odometer", "acquisitionCost", "status", "regionId" }`
* **`GET /vehicles`**: Paginated list of vehicles in the fleet.
  * *Query Params*: `?page=1&limit=10&status=AVAILABLE&regionId=uuid`
* **`GET /vehicles/{id}`**: Get detailed vehicle specs.
* **`PATCH /vehicles/{id}`**: Update vehicle variables.
* **`DELETE /vehicles/{id}`**: Soft-delete vehicle from system.

### 3. Driver Management (`/drivers`)

* **`POST /drivers`**: Register a new driver profile.
  * *Request Body*: `{ "name", "licenseNumber", "licenseCategory", "licenseExpiry", "contactNumber", "safetyScore", "userId" }`
* **`GET /drivers`**: Paginated list of drivers.
* **`GET /drivers/{id}`**: Get driver by ID.
* **`PATCH /drivers/{id}`**: Update profile fields.
* **`DELETE /drivers/{id}`**: Soft-delete driver.

### 4. Trip Dispatch System (`/trips`)

* **`POST /trips`**: Create a trip itinerary draft.
  * *Request Body*: `{ "vehicleId", "driverId", "source", "destination", "cargoWeight", "plannedDistance" }`
* **`GET /trips`**: Query, list, and filter trips.
* **`GET /trips/{id}`**: Fetch detailed trip status & logs.
* **`POST /trips/{id}/dispatch`**: Transitions vehicle & driver to `ON_TRIP`.
* **`POST /trips/{id}/complete`**: Releasing resources, updating odometer, logging actual stats.
  * *Request Body*: `{ "actualDistance", "revenue", "fuelUsed", "finalOdometer" }`
* **`POST /trips/{id}/cancel`**: Transition status to `CANCELLED`, release resources.
* **`DELETE /trips/{id}`**: Soft-delete trip.

### 5. Maintenance Logging (`/maintenance`)

* **`POST /maintenance`**: Schedule or log maintenance service.
  * *Request Body*: `{ "vehicleId", "type", "cost", "vendor", "date", "status", "description" }`
* **`GET /maintenance`**: View scheduled/past operations.
* **`GET /maintenance/{id}`**: Details.
* **`PATCH /maintenance/{id}`**: Update status (e.g. `SCHEDULED` → `IN_PROGRESS` → `COMPLETED`).
* **`DELETE /maintenance/{id}`**: Delete maintenance log.

### 6. Fuel Logs (`/fuel`)

* **`POST /fuel`**: Log refuel event.
  * *Request Body*: `{ "vehicleId", "tripId", "quantity", "cost", "station", "date" }`
* **`GET /fuel`**: Get fuel audit logs.
* **`GET /fuel/vehicle/{vehicleId}/metrics`**: Returns calculated MPG/KML and cost-per-km metrics.

### 7. Expense Tracking (`/expenses`)

* **`POST /expenses`**: Record toll, parking, insurance or repair expense.
  * *Request Body*: `{ "vehicleId", "tripId", "category", "amount", "date", "description" }`
* **`GET /expenses`**: List expenses.
* **`GET /expenses/vehicle/{vehicleId}/cost`**: Get aggregated fleet cost breakdowns.

### 8. Analytics & Reporting (`/analytics` & `/reports`)

* **`GET /analytics/fleet-utilization`**: Vehicle utilization rates, average profit margins, and cost statistics.
* **`GET /analytics/driver-performance`**: Rank drivers by safety scores, distance logged, and revenue.
* **`GET /analytics/monthly-report`**: Monthly operations overview.
* **`GET /reports/fleet-utilization/csv`**: Export fleet dataset as CSV.
* **`GET /reports/fleet-utilization/excel`**: Export spreadsheet formatted (.xlsx).
* **`GET /reports/fleet-utilization/pdf`**: Export dashboard summary as PDF.

---

## 🔍 Health Diagnostics (`/health`)

Use this endpoint to monitor server status:
```http
GET /health
```
**Expected Response (200 OK)**:
```json
{
  "success": true,
  "status": "healthy",
  "service": "TransitOps Enterprise Backend",
  "timestamp": "2026-07-12T13:22:36Z"
}
```
If Swagger UI is enabled on the server, you can view the interactive testing console at:
* **Swagger UI Docs**: `http://localhost:3000/api-docs`
* **Swagger Raw Schema**: `http://localhost:3000/api-docs.json`

use docker postgres (cmd): docker exec -it transitops-postgres psql -U postgres -d transitops