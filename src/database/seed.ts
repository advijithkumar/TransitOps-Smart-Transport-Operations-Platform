import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissionsList = [
  // Vehicle management
  { name: "CREATE_VEHICLE", description: "Create fleet vehicles" },
  { name: "UPDATE_VEHICLE", description: "Update vehicle details" },
  { name: "DELETE_VEHICLE", description: "Soft-delete vehicle records" },
  { name: "VIEW_VEHICLE", description: "View vehicles and statuses" },
  
  // Driver management
  { name: "CREATE_DRIVER", description: "Register new drivers" },
  { name: "UPDATE_DRIVER", description: "Modify driver profiles" },
  { name: "DELETE_DRIVER", description: "Soft-delete driver records" },
  { name: "VIEW_DRIVER", description: "View driver rosters and status" },
  
  // Trip planning
  { name: "CREATE_TRIP", description: "Create transit routes/cargo" },
  { name: "UPDATE_TRIP", description: "Edit planned routes" },
  { name: "DELETE_TRIP", description: "Soft-delete trip plans" },
  { name: "VIEW_TRIP", description: "View fleet trip status" },
  { name: "DISPATCH_TRIP", description: "Dispatch vehicle and driver" },
  { name: "COMPLETE_TRIP", description: "Mark trips as delivered/complete" },
  { name: "CANCEL_TRIP", description: "Cancel active or scheduled trips" },
  
  // Maintenance logs
  { name: "CREATE_MAINTENANCE", description: "Log service repairs" },
  { name: "UPDATE_MAINTENANCE", description: "Complete service records" },
  { name: "VIEW_MAINTENANCE", description: "View service schedules" },
  
  // Fuel & Expense operations
  { name: "CREATE_FUEL", description: "Record refuels" },
  { name: "VIEW_FUEL", description: "View fuel logs" },
  { name: "CREATE_EXPENSE", description: "Record trip expenses" },
  { name: "VIEW_EXPENSE", description: "View operational expenses" },
  
  // Analytics & Reports
  { name: "VIEW_ANALYTICS", description: "Access platform dashboards" },
  { name: "VIEW_REPORTS", description: "Export PDF/Excel operational reports" },

  // GPS & Geofencing
  { name: "CREATE_GEOFENCE", description: "Define geofence boundaries" },
  { name: "VIEW_GEOFENCE", description: "View geofences and events" },
  { name: "MANAGE_GPS", description: "Configure GPS hardware devices" }
];

const rolesList = [
  { name: "ADMIN", description: "System Administrator with full master access" },
  { name: "FLEET_MANAGER", description: "Manages vehicles, maintenance, and logistics" },
  { name: "DISPATCHER", description: "Manages trips, routes, and drivers assignment" },
  { name: "DRIVER", description: "App access for active trips and telemetry updates" },
  { name: "SAFETY_OFFICER", description: "Monitors vehicle documents, driver scoring, and audit logs" },
  { name: "FINANCIAL_ANALYST", description: "Reviews fuel logs, expenses, ROI, and exports reports" }
];

async function main() {
  console.log("Seeding database records...");

  // 1. Seed Permissions
  const seededPermissions: Record<string, string> = {};
  for (const perm of permissionsList) {
    const record = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
    seededPermissions[perm.name] = record.id;
  }
  console.log(`Seeded ${Object.keys(seededPermissions).length} permissions.`);

  // 2. Seed Roles
  const seededRoles: Record<string, string> = {};
  for (const r of rolesList) {
    const record = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    seededRoles[r.name] = record.id;
  }
  console.log(`Seeded ${Object.keys(seededRoles).length} roles.`);

  // 3. Map Role Permissions
  // Admin gets all
  for (const permName of Object.keys(seededPermissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles["ADMIN"],
          permissionId: seededPermissions[permName],
        },
      },
      update: {},
      create: {
        roleId: seededRoles["ADMIN"],
        permissionId: seededPermissions[permName],
      },
    });
  }

  // Fleet Manager Mapping
  const managerPermissions = [
    "CREATE_VEHICLE", "UPDATE_VEHICLE", "VIEW_VEHICLE",
    "CREATE_DRIVER", "UPDATE_DRIVER", "VIEW_DRIVER",
    "CREATE_MAINTENANCE", "UPDATE_MAINTENANCE", "VIEW_MAINTENANCE",
    "CREATE_FUEL", "VIEW_FUEL", "CREATE_EXPENSE", "VIEW_EXPENSE",
    "VIEW_ANALYTICS", "VIEW_REPORTS", "CREATE_GEOFENCE", "VIEW_GEOFENCE", "MANAGE_GPS"
  ];
  for (const perm of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles["FLEET_MANAGER"],
          permissionId: seededPermissions[perm],
        },
      },
      update: {},
      create: {
        roleId: seededRoles["FLEET_MANAGER"],
        permissionId: seededPermissions[perm],
      },
    });
  }

  // Dispatcher Mapping
  const dispatcherPermissions = [
    "VIEW_VEHICLE", "VIEW_DRIVER", "CREATE_DRIVER", "UPDATE_DRIVER",
    "CREATE_TRIP", "UPDATE_TRIP", "VIEW_TRIP", "DISPATCH_TRIP", "COMPLETE_TRIP", "CANCEL_TRIP",
    "VIEW_GEOFENCE", "VIEW_MAINTENANCE",
    "CREATE_FUEL", "VIEW_FUEL", "CREATE_EXPENSE", "VIEW_EXPENSE"
  ];
  for (const perm of dispatcherPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles["DISPATCHER"],
          permissionId: seededPermissions[perm],
        },
      },
      update: {},
      create: {
        roleId: seededRoles["DISPATCHER"],
        permissionId: seededPermissions[perm],
      },
    });
  }

  // Driver Mapping
  const driverPermissions = [
    "VIEW_TRIP", "COMPLETE_TRIP",
    "CREATE_FUEL", "VIEW_FUEL", "CREATE_EXPENSE", "VIEW_EXPENSE"
  ];
  for (const perm of driverPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles["DRIVER"],
          permissionId: seededPermissions[perm],
        },
      },
      update: {},
      create: {
        roleId: seededRoles["DRIVER"],
        permissionId: seededPermissions[perm],
      },
    });
  }

  // Safety Officer Mapping
  const safetyPermissions = [
    "VIEW_VEHICLE", "VIEW_DRIVER", "VIEW_TRIP", "VIEW_MAINTENANCE", "VIEW_GEOFENCE"
  ];
  for (const perm of safetyPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles["SAFETY_OFFICER"],
          permissionId: seededPermissions[perm],
        },
      },
      update: {},
      create: {
        roleId: seededRoles["SAFETY_OFFICER"],
        permissionId: seededPermissions[perm],
      },
    });
  }

  // Financial Analyst Mapping
  const financialPermissions = [
    "VIEW_VEHICLE", "VIEW_FUEL", "VIEW_EXPENSE", "VIEW_ANALYTICS", "VIEW_REPORTS"
  ];
  for (const perm of financialPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles["FINANCIAL_ANALYST"],
          permissionId: seededPermissions[perm],
        },
      },
      update: {},
      create: {
        roleId: seededRoles["FINANCIAL_ANALYST"],
        permissionId: seededPermissions[perm],
      },
    });
  }
  console.log("Seeded role permission mappings successfully.");

  // 4. Seed Default Admin User
  const adminEmail = "admin@transitops.com";
  const adminPassword = await bcrypt.hash("Password123", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: "System Administrator",
      phone: "+15550199",
      roleId: seededRoles["ADMIN"],
    },
  });
  console.log(`Seeded default administrator: ${adminEmail} (password: Password123)`);

  // 5. Seed Regions
  const regions = [
    { name: "North Region", description: "Northern logistics sector" },
    { name: "South Region", description: "Southern shipping channels" },
    { name: "East Region", description: "East coast shipping routes" },
    { name: "West Region", description: "Pacific regional operations" }
  ];
  for (const reg of regions) {
    await prisma.region.upsert({
      where: { name: reg.name },
      update: {},
      create: reg,
    });
  }
  console.log("Seeded default regions.");

  // 6. Seed Vehicle Types
  const vTypes = [
    { name: "Semi-Truck", description: "Heavy duty freight tractor unit" },
    { name: "Flatbed", description: "Open flatbed hauling truck" },
    { name: "Box Truck", description: "Enclosed cube cargo carrier" },
    { name: "Cargo Van", description: "Light commercial delivery van" }
  ];
  for (const vt of vTypes) {
    await prisma.vehicleType.upsert({
      where: { name: vt.name },
      update: {},
      create: vt,
    });
  }
  console.log("Seeded default vehicle types.");
  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during database seed run:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
