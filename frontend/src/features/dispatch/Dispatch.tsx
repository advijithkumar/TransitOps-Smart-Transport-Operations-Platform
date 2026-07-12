import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Trip } from '../../services/mockData';
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Truck, 
  User, 
  Clock, 
  TrendingUp, 
  Calendar 
} from 'lucide-react';
import { toast } from 'sonner';

export const Dispatch: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');

  // Form state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoWeight, setCargoWeight] = useState(15000);
  const [plannedDistance, setPlannedDistance] = useState(450);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Queries
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list });
  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: api.drivers.list });
  const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: api.trips.list });

  // Mutations
  const createTripMutation = useMutation({
    mutationFn: api.trips.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip itinerary created successfully.');
      // Reset form
      setSource('');
      setDestination('');
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setActiveTab('list');
    }
  });

  const dispatchMutation = useMutation({
    mutationFn: api.trips.dispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Route dispatched successfully.');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: api.trips.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.error('Trip status cancelled.');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedDriverId) {
      toast.error('You must assign a vehicle and a driver.');
      return;
    }
    createTripMutation.mutate({
      vehicleId: selectedVehicleId,
      driverId: selectedDriverId,
      source,
      destination,
      cargoWeight,
      plannedDistance,
      revenue: Math.round(plannedDistance * 2.8) // Simulated revenue multiplier
    });
  };

  const handleDispatch = (id: string) => {
    dispatchMutation.mutate(id);
  };

  // Conflict Detection Logic
  const vehicle = vehicles?.find(v => v.id === selectedVehicleId);
  const driver = drivers?.find(d => d.id === selectedDriverId);

  const conflicts: string[] = [];
  if (vehicle && vehicle.status !== 'AVAILABLE') {
    conflicts.push(`Vehicle is currently ${vehicle.status}.`);
  }
  if (driver && driver.status !== 'AVAILABLE') {
    conflicts.push(`Driver is currently ${driver.status}.`);
  }
  if (driver && driver.safetyScore < 80) {
    conflicts.push(`Warning: Driver safety rating is low (${driver.safetyScore} points).`);
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dispatch Console</h2>
          <p className="text-xs text-muted-foreground">Manage ongoing logistics shipments, plan load schedules, and assign carrier assets.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`text-xs px-3.5 py-1.5 rounded font-semibold border ${
              activeTab === 'list' 
                ? 'bg-secondary text-primary border-border' 
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            Schedules List
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`text-xs px-3.5 py-1.5 rounded font-semibold border ${
              activeTab === 'create' 
                ? 'bg-secondary text-primary border-border' 
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            Create Itinerary
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        /* Create Trip Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border p-6 rounded-lg shadow-sm space-y-6">
            <h3 className="text-sm font-semibold tracking-tight">Plan Shipment Route</h3>
            
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold">Source Location Hub</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicago Terminal #4"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Destination Depot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dallas Distribution Center"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold">Cargo Load Weight (kg)</label>
                  <input
                    type="number"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(Number(e.target.value))}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Planned Route Distance (km)</label>
                  <input
                    type="number"
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(Number(e.target.value))}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold">Assign Carrier Truck</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles?.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} ({v.name}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Assign Certified Driver</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers?.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} CDL - {d.status} - Rating: {d.safetyScore}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button 
                  type="submit"
                  disabled={conflicts.some(c => c.includes('unavailable') || c.includes('currently'))}
                  className="px-5 py-2.5 bg-foreground text-background font-semibold rounded text-xs hover:opacity-90 transition-all shadow disabled:opacity-50"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>

          {/* Conflict Warnings Panel */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">Schedule Conflict Check</h3>
            
            {!selectedVehicleId && !selectedDriverId ? (
              <p className="text-xs text-muted-foreground text-center py-6">Select a vehicle and driver to evaluate route constraints.</p>
            ) : (
              <div className="space-y-4">
                {conflicts.length === 0 ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-md text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Ready for Dispatch
                    </p>
                    <p className="text-[10px] opacity-80">No vehicle conflicts or driver scheduling constraints discovered.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conflicts.map((c, i) => (
                      <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xs flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-4 text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Revenue:</span>
                    <span className="font-bold">₹{(plannedDistance * 2.8).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Cost (Diesel):</span>
                    <span className="font-semibold">₹{(plannedDistance * 0.9).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Trips List Manager */
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold tracking-tight">Active Freight Schedules</h3>
            <p className="text-[11px] text-muted-foreground">Approve dispatch states or release vehicles into live operations.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                  <th className="p-4 font-bold">Route ID</th>
                  <th className="p-4 font-bold">Details</th>
                  <th className="p-4 font-bold">Driver Assigned</th>
                  <th className="p-4 font-bold">Odometer Distance</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips?.map(t => {
                  const driverInfo = drivers?.find(d => d.id === t.driverId);
                  const vehicleInfo = vehicles?.find(v => v.id === t.vehicleId);
                  return (
                    <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-muted/10">
                      <td className="p-4 font-semibold">{t.id}</td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">
                          {t.source} &rarr; {t.destination}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Truck: {vehicleInfo?.registrationNumber} ({vehicleInfo?.name})
                        </div>
                      </td>
                      <td className="p-4">{driverInfo?.name || 'Unassigned'}</td>
                      <td className="p-4 font-semibold">{t.plannedDistance} km</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          t.status === 'DRAFT' 
                            ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                            : t.status === 'ON_TRIP'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse'
                            : t.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {t.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDispatch(t.id)}
                            className="bg-foreground text-background px-3 py-1.5 rounded font-semibold text-[10px] hover:opacity-90 transition-all shadow-sm"
                          >
                            Dispatch Load
                          </button>
                        )}
                        {t.status === 'ON_TRIP' && (
                          <button
                            disabled
                            className="bg-transparent border border-border text-muted-foreground px-3 py-1.5 rounded text-[10px]"
                          >
                            In Transit
                          </button>
                        )}
                        {t.status === 'DRAFT' && (
                          <button
                            onClick={() => cancelMutation.mutate(t.id)}
                            className="bg-transparent border border-border text-red-500 hover:bg-red-500/5 px-3 py-1.5 rounded font-semibold text-[10px] transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
