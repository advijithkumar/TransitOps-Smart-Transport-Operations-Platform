export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: 'Heavy Truck' | 'Medium Duty' | 'Delivery Van' | 'Service Bus';
  maxCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // USD
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  region: string;
  fuelType: 'Diesel' | 'Electric' | 'Gasoline';
  fuelLevel: number; // percentage
  speed: number; // km/h
  latitude: number;
  longitude: number;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string;
  safetyScore: number; // 0-100
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  tripsCount: number;
  attendance: 'PRESENT' | 'ABSENT' | 'LEAVE';
  violations: number;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number; // kg
  plannedDistance: number; // km
  actualDistance?: number;
  revenue: number;
  fuelUsed?: number;
  status: 'DRAFT' | 'DISPATCHED' | 'ON_TRIP' | 'COMPLETED' | 'CANCELLED';
  date: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: 'Routine Inspection' | 'Brake Service' | 'Engine Overhaul' | 'Tire Replacement' | 'Oil Change';
  cost: number;
  vendor: string;
  date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  description: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  quantity: number; // Liters
  cost: number; // USD
  station: string;
  date: string;
}

export interface ExpenseLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  category: 'Tolls' | 'Parking' | 'Insurance' | 'Permits' | 'Emergency Repair';
  amount: number;
  date: string;
  description: string;
}

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v-001', registrationNumber: 'TX-9842-A', name: 'Volvo FH16 Globetrotter', model: '2024 Heavy Carrier', type: 'Heavy Truck', maxCapacity: 25000, odometer: 142350, acquisitionCost: 165000, status: 'ON_TRIP', region: 'North East', fuelType: 'Diesel', fuelLevel: 68, speed: 65.4, latitude: 40.7128, longitude: -74.0060 },
  { id: 'v-002', registrationNumber: 'CA-3312-C', name: 'Freightliner Cascadia', model: '2023 LongHaul', type: 'Heavy Truck', maxCapacity: 24000, odometer: 189120, acquisitionCost: 152000, status: 'AVAILABLE', region: 'Pacific Southwest', fuelType: 'Diesel', fuelLevel: 95, speed: 0, latitude: 34.0522, longitude: -118.2437 },
  { id: 'v-003', registrationNumber: 'NY-4481-B', name: 'Ford F-550 Super Duty', model: '2022 Utility Box', type: 'Medium Duty', maxCapacity: 8500, odometer: 88400, acquisitionCost: 75000, status: 'MAINTENANCE', region: 'New York Metro', fuelType: 'Diesel', fuelLevel: 42, speed: 0, latitude: 40.7306, longitude: -73.9352 },
  { id: 'v-004', registrationNumber: 'TX-5201-E', name: 'Tesla Semi', model: '2025 Gen-1 Electric', type: 'Heavy Truck', maxCapacity: 22000, odometer: 12400, acquisitionCost: 210000, status: 'ON_TRIP', region: 'Texas Triangle', fuelType: 'Electric', fuelLevel: 81, speed: 72.1, latitude: 29.7604, longitude: -95.3698 },
  { id: 'v-005', registrationNumber: 'IL-1192-S', name: 'Mercedes-Benz Sprinter', model: '2023 High Roof Cargo', type: 'Delivery Van', maxCapacity: 3500, odometer: 42300, acquisitionCost: 55000, status: 'AVAILABLE', region: 'Great Lakes', fuelType: 'Gasoline', fuelLevel: 75, speed: 0, latitude: 41.8781, longitude: -87.6298 },
  { id: 'v-006', registrationNumber: 'FL-6671-K', name: 'Scania R500 V8', model: '2024 Log Carrier', type: 'Heavy Truck', maxCapacity: 26000, odometer: 61500, acquisitionCost: 178000, status: 'OUT_OF_SERVICE', region: 'Southeast', fuelType: 'Diesel', fuelLevel: 12, speed: 0, latitude: 25.7617, longitude: -80.1918 }
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd-001', name: 'Sarah Jenkins', licenseNumber: 'DL-9948203', licenseCategory: 'Class A CDL', licenseExpiry: '2028-09-12', contactNumber: '+1 (555) 019-2834', safetyScore: 94, status: 'ON_TRIP', tripsCount: 142, attendance: 'PRESENT', violations: 0 },
  { id: 'd-002', name: 'Michael Chen', licenseNumber: 'DL-3849102', licenseCategory: 'Class A CDL', licenseExpiry: '2026-11-20', contactNumber: '+1 (555) 014-9921', safetyScore: 88, status: 'AVAILABLE', tripsCount: 210, attendance: 'PRESENT', violations: 1 },
  { id: 'd-003', name: 'David Miller', licenseNumber: 'DL-5528190', licenseCategory: 'Class B CDL', licenseExpiry: '2026-07-30', contactNumber: '+1 (555) 012-7489', safetyScore: 76, status: 'OFF_DUTY', tripsCount: 95, attendance: 'ABSENT', violations: 3 },
  { id: 'd-004', name: 'Elena Rostova', licenseNumber: 'DL-8812948', licenseCategory: 'Class A CDL', licenseExpiry: '2029-01-15', contactNumber: '+1 (555) 018-4421', safetyScore: 98, status: 'ON_TRIP', tripsCount: 64, attendance: 'PRESENT', violations: 0 },
  { id: 'd-005', name: 'Marcus Brody', licenseNumber: 'DL-2201948', licenseCategory: 'Class C CDL', licenseExpiry: '2027-04-10', contactNumber: '+1 (555) 011-8890', safetyScore: 91, status: 'AVAILABLE', tripsCount: 118, attendance: 'PRESENT', violations: 0 }
];

export const INITIAL_TRIPS: Trip[] = [
  { id: 't-001', vehicleId: 'v-001', driverId: 'd-001', source: 'Chicago Distribution Center', destination: 'New York Port Authority', cargoWeight: 18500, plannedDistance: 1270, status: 'ON_TRIP', revenue: 3800, date: '2026-07-12' },
  { id: 't-002', vehicleId: 'v-004', driverId: 'd-004', source: 'Austin Gigafactory', destination: 'Dallas Logistics Hub', cargoWeight: 12000, plannedDistance: 310, status: 'ON_TRIP', revenue: 950, date: '2026-07-12' },
  { id: 't-003', vehicleId: 'v-002', driverId: 'd-002', source: 'Los Angeles Wharf', destination: 'Las Vegas Depot', cargoWeight: 22000, plannedDistance: 430, status: 'COMPLETED', actualDistance: 435, revenue: 1450, fuelUsed: 138, date: '2026-07-11' },
  { id: 't-004', vehicleId: 'v-003', driverId: 'd-003', source: 'Newark Hub', destination: 'Philadelphia Center', cargoWeight: 5000, plannedDistance: 150, status: 'CANCELLED', revenue: 450, date: '2026-07-10' }
];

export const INITIAL_MAINTENANCE: MaintenanceLog[] = [
  { id: 'm-001', vehicleId: 'v-003', type: 'Routine Inspection', cost: 350, vendor: 'FleetCare Solutions', date: '2026-07-12', status: 'IN_PROGRESS', description: 'Bi-annual safety assessment and computer diagnostics scan.' },
  { id: 'm-002', vehicleId: 'v-001', type: 'Brake Service', cost: 1200, vendor: 'Apex Heavy Fleet Services', date: '2026-07-01', status: 'COMPLETED', description: 'Replaced front brake pads and rotors. Bled brake lines.' },
  { id: 'm-003', vehicleId: 'v-002', type: 'Tire Replacement', cost: 2400, vendor: 'Michelin Commercial Express', date: '2026-07-20', status: 'SCHEDULED', description: 'Set of 6 high-durability rear traction tires scheduled.' }
];

export const INITIAL_FUEL: FuelLog[] = [
  { id: 'f-001', vehicleId: 'v-001', tripId: 't-001', quantity: 240, cost: 384, station: 'Pilot Flying J #239', date: '2026-07-12' },
  { id: 'f-002', vehicleId: 'v-002', tripId: 't-003', quantity: 145, cost: 232, station: 'Love’s Travel Stop #112', date: '2026-07-11' }
];

export const INITIAL_EXPENSES: ExpenseLog[] = [
  { id: 'e-001', vehicleId: 'v-001', tripId: 't-001', category: 'Tolls', amount: 125.50, date: '2026-07-12', description: 'I-80 Turnpike interstate electronic toll pass charge.' },
  { id: 'e-002', vehicleId: 'v-002', tripId: 't-003', category: 'Permits', amount: 75.00, date: '2026-07-11', description: 'Interstate oversized cargo transport permit.' }
];
