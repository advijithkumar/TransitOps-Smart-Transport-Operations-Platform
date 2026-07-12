import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  Plus, 
  Wrench, 
  Clock, 
  CheckCircle, 
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export const Maintenance: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('Routine Inspection');
  const [cost, setCost] = useState(250);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');

  // Queries
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list });
  const { data: maintenance } = useQuery({ queryKey: ['maintenance'], queryFn: api.maintenance.list });

  // Mutations
  const createMutation = useMutation({
    mutationFn: api.maintenance.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Maintenance operation scheduled successfully.');
      setIsAdding(false);
      setVehicleId('');
      setVendor('');
      setDescription('');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => api.maintenance.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Maintenance job status updated.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.error('Choose a vehicle.');
      return;
    }
    createMutation.mutate({
      vehicleId,
      type: type as any,
      cost,
      vendor,
      date: new Date().toISOString().split('T')[0],
      status: 'SCHEDULED',
      description
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Maintenance Logs</h2>
          <p className="text-xs text-muted-foreground">Log vehicle breakdowns, schedule routine inspections, and audit service costs.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3.5 py-1.5 rounded font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Service</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-semibold tracking-tight">Schedule Workshop Log</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold">Select Carrier Truck</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2.5 bg-muted border border-border rounded outline-none"
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles?.map(v => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} ({v.name})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold">Service Type Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-muted border border-border rounded outline-none"
              >
                <option value="Routine Inspection">Routine Inspection</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Engine Overhaul">Engine Overhaul</option>
                <option value="Tire Replacement">Tire Replacement</option>
                <option value="Oil Change">Oil Change</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold">Estimated Repair Cost (USD)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full p-2.5 bg-muted border border-border rounded outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold">Service Vendor / Workshop shop</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Heavy Garage Solutions"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full p-2.5 bg-muted border border-border rounded outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold">Task description details</label>
              <input
                type="text"
                required
                placeholder="e.g. Replaced leaking hydraulic seal and refilled transmission fluid."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-muted border border-border rounded outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-border text-muted-foreground rounded hover:bg-muted font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-foreground text-background rounded hover:opacity-90 font-semibold shadow"
            >
              Schedule Job
            </button>
          </div>
        </form>
      )}

      {/* Grid of service tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenance?.map(log => {
          const vehicle = vehicles?.find(v => v.id === log.vehicleId);
          return (
            <div key={log.id} className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    log.status === 'SCHEDULED' 
                      ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      : log.status === 'IN_PROGRESS'
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 animate-pulse'
                      : 'bg-green-500/10 text-green-500 border border-green-500/20'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{log.date}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    {log.type}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">Vehicle: <span className="font-semibold text-foreground">{vehicle?.registrationNumber || 'Unknown'}</span> ({vehicle?.name})</p>
                  <p className="text-[11px] text-muted-foreground mt-2 italic">"{log.description}"</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-4 text-[11px]">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Vendor: <span className="font-semibold text-foreground">{log.vendor}</span></p>
                  <p className="text-muted-foreground">Cost: <span className="font-bold text-foreground">₹{log.cost}</span></p>
                </div>
                
                <div className="flex gap-2">
                  {log.status === 'SCHEDULED' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: log.id, status: 'IN_PROGRESS' })}
                      className="bg-foreground text-background px-2.5 py-1 rounded font-semibold text-[10px] shadow"
                    >
                      Start Repair
                    </button>
                  )}
                  {log.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: log.id, status: 'COMPLETED' })}
                      className="bg-green-600 text-white px-2.5 py-1 rounded font-semibold text-[10px] shadow"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
