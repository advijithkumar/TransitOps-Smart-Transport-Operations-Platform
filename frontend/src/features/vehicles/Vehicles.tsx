import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { Vehicle } from '../../services/mockData';
import { 
  Search, 
  Plus, 
  MapPin, 
  Gauge, 
  DollarSign, 
  Wrench, 
  Fuel, 
  FileText, 
  History, 
  Layers 
} from 'lucide-react';

export const Vehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>('v-001');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'fuel' | 'maintenance' | 'docs' | 'gps'>('details');
  const { activeRole } = useAuthStore();
  const canCreate = activeRole === 'ADMIN' || activeRole === 'FLEET_MANAGER';

  // Form states for creating a vehicle
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    model: '',
    type: 'Heavy Truck' as Vehicle['type'],
    maxCapacity: 20000,
    odometer: 10000,
    acquisitionCost: 120000,
    status: 'AVAILABLE' as Vehicle['status'],
    region: 'North East',
    fuelType: 'Diesel' as Vehicle['fuelType']
  });

  // Queries
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuel'], queryFn: api.fuel.list });
  const { data: maintLogs } = useQuery({ queryKey: ['maintenance'], queryFn: api.maintenance.list });
  const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: api.trips.list });

  // Mutations
  const createMutation = useMutation({
    mutationFn: api.vehicles.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsAdding(false);
      toast.success('Vehicle registered successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to register vehicle (Check permissions)');
    }
  });

  const selectedVehicle = vehicles?.find(v => v.id === selectedId);

  // Filters logic
  const filteredVehicles = vehicles?.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter histories based on selected vehicle
  const filteredFuel = fuelLogs?.filter(f => f.vehicleId === selectedId) || [];
  const filteredMaint = maintLogs?.filter(m => m.vehicleId === selectedId) || [];
  const filteredTrips = trips?.filter(t => t.vehicleId === selectedId) || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      
      {/* 1. Left List Panel */}
      <div className="w-full lg:w-[400px] bg-card border border-border rounded-lg flex flex-col shrink-0">
        
        {/* Search, Filter Toolbar */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Vehicles Database</h3>
            {canCreate && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="flex items-center gap-1 text-[11px] bg-foreground text-background px-2.5 py-1.5 rounded font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register</span>
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search registration or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted text-xs border border-border rounded-md outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'AVAILABLE', 'ON_TRIP', 'MAINTENANCE'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-[10px] px-2.5 py-1 rounded font-semibold border ${
                  filterStatus === status 
                    ? 'bg-secondary text-primary border-border' 
                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* List scroll wrapper */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filteredVehicles?.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={`w-full p-4 text-left flex items-center justify-between transition-all ${
                selectedId === v.id ? 'bg-muted/80' : 'hover:bg-muted/30'
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-foreground">{v.registrationNumber}</p>
                <p className="text-[11px] text-muted-foreground">{v.name}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{v.region} · {v.type}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                v.status === 'AVAILABLE' 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : v.status === 'ON_TRIP'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
              }`}>
                {v.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Right Details / Work Area Panel */}
      <div className="flex-1 bg-card border border-border rounded-lg flex flex-col min-w-0">
        {isAdding ? (
          /* Create Form Panel */
          <form onSubmit={handleCreate} className="p-6 space-y-6 overflow-y-auto flex-1">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Register New Vehicle</h3>
              <p className="text-[11px] text-muted-foreground">Log a new mechanical transport asset into the fleet ERP database.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TX-9842-A"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Volvo FH16 Globetrotter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Model Year & Spec</label>
                <input
                  type="text"
                  placeholder="e.g. 2024 Heavy Carrier"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Category Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Vehicle['type'] })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                >
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Medium Duty">Medium Duty</option>
                  <option value="Delivery Van">Delivery Van</option>
                  <option value="Service Bus">Service Bus</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Initial Odometer (km)</label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Acquisition Cost (USD)</label>
                <input
                  type="number"
                  value={formData.acquisitionCost}
                  onChange={(e) => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-transparent border border-border rounded text-xs font-semibold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-foreground text-background rounded text-xs font-semibold hover:opacity-90 transition-all shadow"
              >
                Save Asset
              </button>
            </div>
          </form>
        ) : selectedVehicle ? (
          /* View Details & Tabs */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header info */}
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-muted border border-border px-2 py-0.5 rounded font-bold uppercase">{selectedVehicle.type}</span>
                <h2 className="text-lg font-bold mt-1 text-foreground">{selectedVehicle.name}</h2>
                <p className="text-xs text-muted-foreground">Plate: <span className="font-semibold text-foreground">{selectedVehicle.registrationNumber}</span> · Region: {selectedVehicle.region}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">Odometer: <span className="font-bold text-foreground">{selectedVehicle.odometer.toLocaleString()} km</span></span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedVehicle.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                }`}>
                  {selectedVehicle.status}
                </span>
              </div>
            </div>

            {/* tab buttons */}
            <div className="flex border-b border-border px-6 overflow-x-auto bg-muted/20">
              {[
                { id: 'details', label: 'Specification', icon: Layers },
                { id: 'fuel', label: 'Fuel Logs', icon: Fuel },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'docs', label: 'Documents', icon: FileText },
                { id: 'gps', label: 'Telemetry/GPS', icon: MapPin }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                    activeTab === t.id 
                      ? 'border-foreground text-foreground font-semibold' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* active tab panel wrapper */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Tab 1: specifications */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Specifications</h3>
                    <div className="divide-y divide-border/60 text-xs">
                      <div className="flex justify-between py-2.5">
                        <span className="text-muted-foreground">Model Spec</span>
                        <span className="font-medium">{selectedVehicle.model}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-muted-foreground">Max Payload Capacity</span>
                        <span className="font-medium">{selectedVehicle.maxCapacity.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-muted-foreground">Acquisition Capital cost</span>
                        <span className="font-medium">₹{selectedVehicle.acquisitionCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-muted-foreground">Primary Fuel Configuration</span>
                        <span className="font-medium">{selectedVehicle.fuelType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-muted/30 p-4 border border-border rounded-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Operational Status</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Fuel Tank status</span>
                          <span className="font-bold">{selectedVehicle.fuelLevel}%</span>
                        </div>
                        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${selectedVehicle.fuelLevel < 25 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${selectedVehicle.fuelLevel}%` }}
                          />
                        </div>
                      </div>

                      <div className="divide-y divide-border/60">
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Current GPS coordinates</span>
                          <span className="font-medium font-mono">{selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Registered Trips count</span>
                          <span className="font-medium">{filteredTrips.length} trips</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Fuel logs */}
              {activeTab === 'fuel' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fuel Refills History</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                      Average Consumption: {(selectedVehicle.odometer / 5000).toFixed(1)} L/100km
                    </span>
                  </div>
                  {filteredFuel.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No fuel audit logs found for this vehicle.</p>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded-md">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                            <th className="p-3">Refill Date</th>
                            <th className="p-3">Volume (Liters)</th>
                            <th className="p-3">Total Cost</th>
                            <th className="p-3">Station</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFuel.map(f => (
                            <tr key={f.id} className="border-b border-border/50 last:border-b-0 hover:bg-muted/10">
                              <td className="p-3 font-medium">{f.date}</td>
                              <td className="p-3 font-semibold">{f.quantity} L</td>
                              <td className="p-3 font-bold">₹{f.cost}</td>
                              <td className="p-3 text-muted-foreground">{f.station}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Maintenance history */}
              {activeTab === 'maintenance' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scheduled Workshop Operations</h3>
                  {filteredMaint.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No mechanical logs logged.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredMaint.map(m => (
                        <div key={m.id} className="p-4 border border-border rounded-lg bg-muted/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground">{m.type}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              m.status === 'COMPLETED' ? 'bg-green-500/15 text-green-500' : 'bg-orange-500/15 text-orange-500'
                            }`}>{m.status}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{m.description}</p>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                            <span>Vendor: <span className="font-semibold text-foreground">{m.vendor}</span></span>
                            <span>Cost: <span className="font-bold text-foreground">₹{m.cost.toLocaleString()}</span></span>
                            <span>Scheduled: <span className="font-semibold">{m.date}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Documents locker */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Digital Document Locker</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Vehicle Registry Certification.pdf', size: '2.4 MB', type: 'Registration' },
                      { name: 'Commercial Liability Insurance Plan.pdf', size: '1.8 MB', type: 'Insurance' }
                    ].map((doc, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-muted/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-muted border border-border rounded flex items-center justify-center text-muted-foreground">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.type} · {doc.size}</p>
                          </div>
                        </div>
                        <button className="text-[11px] font-semibold text-primary hover:underline">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: GPS / Telemetry logs */}
              {activeTab === 'gps' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Device Coordinates Feed</h3>
                  <div className="p-4 border border-border rounded-lg bg-muted/20 font-mono text-[11px] space-y-2">
                    <p className="text-green-500 font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                      Live Device Connected: active telemetry stream
                    </p>
                    <div className="divide-y divide-border/40 text-[10px] text-muted-foreground">
                      <div className="flex justify-between py-1.5">
                        <span>Speed Telemetry</span>
                        <span className="font-semibold text-foreground">{selectedVehicle.speed} km/h</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span>Active Latitude</span>
                        <span className="font-semibold text-foreground">{selectedVehicle.latitude}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span>Active Longitude</span>
                        <span className="font-semibold text-foreground">{selectedVehicle.longitude}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span>Engine Diagnostics Status</span>
                        <span className="font-semibold text-green-500">Normal (0 fault codes)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Select a vehicle to inspect properties.
          </div>
        )}
      </div>

    </div>
  );
};
