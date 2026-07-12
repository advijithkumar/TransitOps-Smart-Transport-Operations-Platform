# TransitOps — Smart Transport Operations Platform

> A full-stack enterprise Fleet Management ERP with real-time GPS tracking, RBAC, trip dispatch, maintenance scheduling, fuel analytics, and live WebSocket telemetry.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Prerequisites](#-prerequisites)
4. [Local Setup Guide](#-local-setup-guide)
   - [1. Clone the Repository](#1-clone-the-repository)
   - [2. Start Infrastructure Services (Docker)](#2-start-infrastructure-services-docker)
   - [3. Configure Environment Variables](#3-configure-environment-variables)
   - [4. Setup and Run the Backend](#4-setup-and-run-the-backend)
   - [5. Setup and Run the Frontend](#5-setup-and-run-the-frontend)
   - [6. Login to the Application](#6-login-to-the-application)
5. [Frontend Architecture](#-frontend-architecture)
6. [Backend Architecture](#-backend-architecture)
7. [RBAC — Roles & Permissions](#-rbac--roles--permissions)
8. [API Endpoint Reference](#-api-endpoint-reference)
9. [Real-time WebSockets (Socket.IO)](#-real-time-websockets-socketio)
10. [IoT Telemetry (MQTT)](#-iot-telemetry-mqtt)
11. [Health Diagnostics](#-health-diagnostics)

---

## 🚀 Project Overview

TransitOps is a production-grade Smart Transport Operations Platform built for logistics companies, transit authorities, and enterprise fleet managers. The platform provides a complete real-time operational dashboard with:

- **Live GPS Vehicle Tracking** via MQTT telemetry and MapLibre maps
- **Role-Based Access Control (RBAC)** with 6 user roles and granular permissions
- **Trip Dispatch Engine** — Create, dispatch, complete, or cancel cargo routes
- **Driver Registry** — License compliance tracking, safety scoring, and duty management
- **Vehicle Fleet Management** — Asset registration, fuel logs, maintenance history
- **Fuel & Expense Analytics** — INR cost breakdowns, per-km metrics
- **Real-time Notifications** via Socket.IO broadcast rooms
- **Report Exports** — PDF, CSV, and Excel report generation

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS v3 | Utility-first styling |
| TanStack Query | Server state & caching |
| TanStack Table | Data grid tables |
| Zustand | Auth state management |
| Framer Motion | UI animations |
| Recharts | Analytics charting |
| MapLibre GL | Live GPS map rendering |
| Socket.IO Client | Real-time WebSocket events |
| Axios | HTTP API client with JWT interceptors |
| Sonner | Toast notifications |
| Lucide React | Icon library |
| React Router DOM | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express + TypeScript | API server |
| Prisma ORM | Database access layer |
| PostgreSQL + PostGIS | Relational DB with spatial indexing |
| Redis (ioredis) | JWT blacklisting, caching, pub/sub |
| BullMQ | Background job queues (email, reports) |
| Socket.IO | Real-time WebSocket server |
| MQTT (mqtt.js) | IoT telemetry from GPS hardware |
| Helmet + CORS + Rate Limiter | Security middleware |
| Nodemailer | Email notifications via SMTP |
| ExcelJS + PDFKit + csv-stringify | Report generation |

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed:

| Tool | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | v18.x or later | `node --version` |
| **npm** | v9.x or later | `npm --version` |
| **Docker** | v24.x or later | `docker --version` |
| **Docker Compose** | v2.x or later | `docker compose version` |
| **Git** | v2.x or later | `git --version` |

---

## 🛠️ Local Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/TransitOps-Smart-Transport-Operations-Platform.git
cd TransitOps-Smart-Transport-Operations-Platform
```

---

### 2. Start Infrastructure Services (Docker)

The project requires **PostgreSQL (with PostGIS)**, **Redis**, and **MQTT Broker (Mosquitto)** running. A `docker-compose.yml` is provided in the project root.

```bash
docker compose up -d
```

This starts the following containers:

| Container | Service | Port |
|---|---|---|
| `transitops-postgres` | PostgreSQL + PostGIS | `5433` |
| `transitops-redis` | Redis Cache | `6379` |
| `transitops-mqtt` | Eclipse Mosquitto | `1883` |

Verify all services are healthy:
```bash
docker compose ps
```

To access the PostgreSQL database shell directly:
```bash
docker exec -it transitops-postgres psql -U postgres -d transitops
```

---

### 3. Configure Environment Variables

Create a `.env` file in the **project root** (next to `package.json`):

```bash
cp .env.example .env
```

If no `.env.example` exists, create `.env` manually with the following content:

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

# Nodemailer SMTP Configuration (uses Ethereal for dev/testing)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="transitops@ethereal.email"
SMTP_PASS="transitops_pass"
EMAIL_FROM="TransitOps Alerts <alerts@transitops.com>"

# MinIO / AWS S3 Storage (for document uploads)
S3_ENDPOINT="localhost"
S3_PORT=9000
S3_USE_SSL=false
S3_ACCESS_KEY="minio_admin"
S3_SECRET_KEY="minio_admin_secret"
S3_BUCKET_NAME="transitops-documents"
```

---

### 4. Setup and Run the Backend

**Install dependencies:**
```bash
npm install
```

**Generate the Prisma client:**
```bash
npm run prisma:generate
```

**Run database migrations** (creates all tables):
```bash
npm run prisma:migrate
```

**Seed the database** (creates roles, permissions, regions, vehicle types, and a default admin user):
```bash
npm run prisma:seed
```

After seeding, a default administrator account is created:
| Field | Value |
|---|---|
| **Email** | `admin@transitops.com` |
| **Password** | `Password123` |
| **Role** | `ADMIN` (full access) |

**Start the backend development server:**
```bash
npm run dev
```

The backend will start on **`http://localhost:3000`**. You should see output like:
```
[INFO] Database connection established
[INFO] Redis connection established
[INFO] Socket.IO server initialized
[INFO] MQTT broker connected
[INFO] BullMQ workers started
[INFO] TransitOps server running on port 3000
```

---

### 5. Setup and Run the Frontend

Open a **new terminal** and navigate to the `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts on **`http://localhost:5173`**.

> **Note:** The frontend uses a Vite proxy to forward all `/api` and `/socket.io` requests to the backend at `http://localhost:3000`, so both servers must be running simultaneously.

---

### 6. Login to the Application

Open your browser and navigate to: **`http://localhost:5173`**

You will be redirected to the login page. Use the seeded admin account:

| Field | Value |
|---|---|
| **Email** | `admin@transitops.com` |
| **Password** | `Password123` |

To create accounts with other roles, register via **`POST /api/auth/register`** with the appropriate `roleName` (see [RBAC section](#-rbac--roles--permissions)) or use the Signup page at `http://localhost:5173/signup`.

---

## 🖥️ Frontend Architecture

The frontend is a **React 18 + TypeScript** single-page application built with **Vite**.

### Module Structure

```
frontend/src/
├── app/
│   ├── router.tsx         # React Router DOM route definitions
│   └── providers.tsx      # QueryClient, Socket.IO, Theme context providers
├── features/
│   ├── auth/              # Login, Signup, ForgotPassword, ResetPassword pages
│   ├── dashboard/         # KPI overview, fleet summary, revenue charts
│   ├── vehicles/          # Vehicle registry, fuel logs, maintenance tabs, GPS
│   ├── drivers/           # Driver roster, license compliance, safety scores
│   ├── dispatch/          # Trip creation, dispatch console, conflict validation
│   ├── maintenance/       # Service scheduling and status tracking
│   ├── fuel-expenses/     # Fuel audit logs and operational expense tables
│   ├── analytics/         # Fleet utilization, driver performance, ROI charts
│   ├── tracking/          # MapLibre live GPS vehicle tracking map
│   └── settings/          # System config, themes, notification rules
├── layouts/
│   └── DashboardLayout.tsx # Sidebar navigation, header, notification bell
├── services/
│   └── api.ts             # Axios client with JWT interceptors and endpoint wrappers
├── store/
│   └── authStore.ts       # Zustand store for access/refresh tokens and user state
└── index.css              # Tailwind base styles and CSS variables (dark/light theme)
```

### Key Design Decisions

- **Odoo-inspired UI**: Solid icons, bold/light typography contrast, colored app tiles on dashboard
- **Dark/Light Mode**: Persisted via `localStorage` using CSS variable theming
- **RBAC-aware UI**: Create/edit buttons are conditionally rendered based on the logged-in user's role
- **Optimistic Error UX**: All API mutations show toast notifications (success and error) using Sonner
- **Real API Integration**: All modules use the real REST backend — no mock data in production screens
- **INR Currency**: All monetary values use the ₹ Indian Rupee symbol throughout the platform

### Authentication Flow

1. User submits credentials on `/login`
2. Backend returns `{ accessToken, refreshToken, user }` 
3. Tokens stored in Zustand (persisted to `localStorage`)
4. Axios request interceptor attaches `Authorization: Bearer <token>` to every request
5. On `401 Unauthorized`, the response interceptor automatically calls `/api/auth/refresh`
6. On refresh failure, user is logged out and redirected to `/login`

---

## ⚙️ Backend Architecture

The TransitOps backend is a **modular monolith** using Node.js + Express + TypeScript.

### Server Bootstrap Order (`src/server.ts`)

1. **Database**: Connects via `PrismaClient` to PostgreSQL (with PostGIS spatial extensions)
2. **Cache**: Authenticates connection to Redis
3. **HTTP Server**: Wraps the Express app
4. **WebSocket Server**: Integrates `Socket.IO` with JWT verification middleware
5. **MQTT Subscriber**: Connects to Mosquitto broker; subscribes to `vehicle/+/telemetry`
6. **BullMQ Workers**: Starts background workers for email, expiry checks, and report generation
7. **HTTP Listener**: Starts listening on the configured `PORT` (default `3000`)

---

## 🔑 RBAC — Roles & Permissions

All API requests (except `/health` and auth endpoints) require a valid Bearer JWT:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Role Capabilities

| Role | Description | Key Permissions |
|---|---|---|
| **ADMIN** | Full system access | All permissions |
| **FLEET_MANAGER** | Manages vehicles, drivers, logistics | CREATE/UPDATE vehicles & drivers, all fuel/expense, analytics |
| **DISPATCHER** | Manages trips and driver assignments | CREATE/UPDATE drivers, full trip lifecycle, fuel & expense logs |
| **DRIVER** | App access for self-management | VIEW/COMPLETE assigned trips, log fuel & expenses |
| **SAFETY_OFFICER** | Fleet compliance and safety monitoring | VIEW vehicles, drivers, trips, maintenance, geofences |
| **FINANCIAL_ANALYST** | Financial reporting and analytics | VIEW fuel, expenses, analytics, reports |

---

## 📡 API Endpoint Reference

All endpoints are prefixed with `/api`.

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Authenticate and get tokens | No |
| `POST` | `/auth/refresh` | Refresh access token | No |
| `POST` | `/auth/logout` | Invalidate session (JWT blacklist) | Yes |
| `POST` | `/auth/forgot-password` | Request password reset email | No |
| `POST` | `/auth/reset-password` | Submit new password with reset token | No |

**Register request body:**
```json
{ "email": "user@example.com", "password": "SecurePass123", "name": "John Doe", "phone": "+91987654321", "roleName": "DISPATCHER" }
```

**Login request body:**
```json
{ "email": "admin@transitops.com", "password": "Password123" }
```

---

### Vehicle Management (`/vehicles`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/vehicles` | `CREATE_VEHICLE` | Register a new fleet vehicle |
| `GET` | `/vehicles` | `VIEW_VEHICLE` | List all vehicles (filter by `status`, `typeId`, `regionId`) |
| `GET` | `/vehicles/:id` | `VIEW_VEHICLE` | Get detailed vehicle specs |
| `PATCH` | `/vehicles/:id` | `UPDATE_VEHICLE` | Update vehicle fields |
| `DELETE` | `/vehicles/:id` | `DELETE_VEHICLE` | Soft-delete vehicle |

**Create vehicle request body:**
```json
{ "registrationNumber": "TN-01-AB-1234", "name": "Volvo FH16", "model": "FH16 Globetrotter", "typeId": "uuid", "maxCapacity": 20000, "odometer": 15000, "acquisitionCost": 4500000, "status": "AVAILABLE", "regionId": "uuid" }
```

---

### Driver Management (`/drivers`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/drivers` | `CREATE_DRIVER` | Register a new driver |
| `GET` | `/drivers` | `VIEW_DRIVER` | List all driver profiles |
| `GET` | `/drivers/:id` | `VIEW_DRIVER` | Get driver profile by ID |
| `PATCH` | `/drivers/:id` | `UPDATE_DRIVER` | Update driver details |
| `DELETE` | `/drivers/:id` | `DELETE_DRIVER` | Soft-delete driver |

**Create driver request body:**
```json
{ "name": "Ravi Kumar", "licenseNumber": "TN0120240012345", "licenseCategory": "HMV", "licenseExpiry": "2044-06-30", "contactNumber": "+919876543210", "safetyScore": 95 }
```

**License Category values:** `HMV`, `LMV-TR`, `CDL`, `LMV-NT`, `MCWG`, `MCWOG`, `MC 50cc`, `LL`, `DL`, `IDP`

---

### Trip Dispatch (`/trips`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/trips` | `CREATE_TRIP` | Create a trip draft |
| `GET` | `/trips` | `VIEW_TRIP` | List all trips |
| `GET` | `/trips/:id` | `VIEW_TRIP` | Get trip details |
| `PATCH` | `/trips/:id` | `UPDATE_TRIP` | Edit planned trip |
| `POST` | `/trips/:id/dispatch` | `DISPATCH_TRIP` | Dispatch vehicle and driver |
| `POST` | `/trips/:id/complete` | `COMPLETE_TRIP` | Mark trip as complete |
| `POST` | `/trips/:id/cancel` | `CANCEL_TRIP` | Cancel active/scheduled trip |
| `DELETE` | `/trips/:id` | `DELETE_TRIP` | Soft-delete trip |

**Create trip request body:**
```json
{ "vehicleId": "uuid", "driverId": "uuid", "source": "Chennai", "destination": "Mumbai", "cargoWeight": 12000, "plannedDistance": 1350 }
```

---

### Maintenance Logging (`/maintenance`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/maintenance` | `CREATE_MAINTENANCE` | Schedule/log a service event |
| `GET` | `/maintenance` | `VIEW_MAINTENANCE` | View all maintenance records |
| `GET` | `/maintenance/:id` | `VIEW_MAINTENANCE` | Get maintenance log details |
| `PATCH` | `/maintenance/:id` | `UPDATE_MAINTENANCE` | Update status/details |
| `DELETE` | `/maintenance/:id` | — | Remove maintenance log |

**Create maintenance request body:**
```json
{ "vehicleId": "uuid", "type": "OIL_CHANGE", "cost": 3500, "vendor": "Bosch Service", "date": "2026-07-20", "status": "SCHEDULED", "description": "Routine 10,000 km oil change" }
```

**Maintenance types:** `OIL_CHANGE`, `TYRE_CHANGE`, `BRAKE_REPAIR`, `ENGINE_SERVICE`, `OTHER`

---

### Fuel Logs (`/fuel`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/fuel` | `CREATE_FUEL` | Log a refuel event |
| `GET` | `/fuel` | `VIEW_FUEL` | List fuel audit logs |
| `GET` | `/fuel/vehicle/:vehicleId/metrics` | `VIEW_FUEL` | Get cost-per-km and MPG metrics |

---

### Expense Tracking (`/expenses`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/expenses` | `CREATE_EXPENSE` | Record a trip expense |
| `GET` | `/expenses` | `VIEW_EXPENSE` | List all operational expenses |
| `GET` | `/expenses/vehicle/:vehicleId/cost` | `VIEW_EXPENSE` | Aggregated cost breakdown per vehicle |

**Expense categories:** `TOLLS`, `PARKING`, `REPAIRS`, `INSURANCE`, `MISCELLANEOUS`

---

### Analytics & Reports (`/analytics`, `/reports`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/analytics/fleet-utilization` | `VIEW_ANALYTICS` | Utilization rates, margins, cost stats |
| `GET` | `/analytics/driver-performance` | `VIEW_ANALYTICS` | Driver rankings and safety scores |
| `GET` | `/analytics/monthly-report` | `VIEW_ANALYTICS` | Monthly operational overview |
| `GET` | `/reports/fleet-utilization/csv` | `VIEW_REPORTS` | Export as CSV |
| `GET` | `/reports/fleet-utilization/excel` | `VIEW_REPORTS` | Export as .xlsx |
| `GET` | `/reports/fleet-utilization/pdf` | `VIEW_REPORTS` | Export as PDF |

---

## 🔄 Real-time WebSockets (Socket.IO)

The WebSocket server runs at `ws://localhost:3000`. Pass your JWT in the `auth` object on connect:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', { auth: { token: accessToken } });
```

### Rooms Joined Automatically on Connect:
- `role:<USER_ROLE>` — e.g., `role:FLEET_MANAGER`
- `user:<USER_ID>` — private user channel
- `fleet-operations` — joined by ADMIN, FLEET_MANAGER, and DISPATCHER

### Server-Emitted Events

| Event | Room | Payload |
|---|---|---|
| `gps:location-update` | `fleet-operations` | `{ deviceId, vehicleId, latitude, longitude, speed, heading }` |
| `trip:status-change` | `fleet-operations` | `{ tripId, status, vehicleId, driverId }` |
| `system:alert` | `user:<userId>` | `{ title, message }` |
| `dashboard:kpi-update` | `fleet-operations` | Live KPI block data |

### Client-Emitted Events

| Event | Payload | Description |
|---|---|---|
| `join-role-room` | `{ role: "FLEET_MANAGER" }` | Manually join your role room |

---

## 📡 IoT Telemetry (MQTT)

The server subscribes to GPS device payloads via Eclipse Mosquitto on the following topics:

### Topic: `vehicle/{deviceId}/telemetry`
Live location update from hardware GPS tracker:
```json
{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "speed": 65.4,
  "heading": 180.0,
  "altitude": 10.5,
  "timestamp": "2026-07-12T13:22:36Z"
}
```
On receipt: Updates `live_locations` table (PostGIS geometry), appends `location_history`, caches in Redis (5 min TTL), and broadcasts `gps:location-update` via Socket.IO.

### Topic: `vehicle/{deviceId}/status`
```json
{ "status": "ACTIVE" }
```

---

## 🔍 Health Diagnostics

```http
GET /health
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "service": "TransitOps Enterprise Backend",
  "timestamp": "2026-07-12T13:22:36Z"
}
```

Interactive API testing console (if Swagger is enabled):
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Swagger JSON Schema**: `http://localhost:3000/api-docs.json`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `ECONNREFUSED 127.0.0.1:3000` | Backend is not running. Run `npm run dev` in the project root. |
| `ECONNREFUSED 127.0.0.1:5433` | PostgreSQL Docker container not running. Run `docker compose up -d`. |
| `403 Forbidden` on an endpoint | Your role lacks the required permission. Log out and log back in if you recently updated permissions via seed. |
| `401 Unauthorized` on login | Double-check email/password. The seeded admin is `admin@transitops.com` / `Password123`. |
| Socket.IO CORS errors in browser | Ensure Vite frontend is running on port `5173` and the Vite proxy is configured in `frontend/vite.config.ts`. |
| Prisma schema errors | Run `npm run prisma:generate` after any schema changes. |

---

*TransitOps — Built for enterprise fleet operations. © 2026*