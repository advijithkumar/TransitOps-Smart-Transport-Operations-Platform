import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { 
  UserSquare, 
  ShieldCheck, 
  AlertOctagon, 
  Phone, 
  Calendar, 
  Map, 
  Activity, 
  Plus 
} from 'lucide-react';

export const Drivers: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>('d-001');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { activeRole } = useAuthStore();
  const canCreate = activeRole === 'ADMIN' || activeRole === 'FLEET_MANAGER' || activeRole === 'DISPATCHER';

  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'HMV',
    licenseExpiry: '',
    contactNumber: '',
    safetyScore: 90,
    status: 'AVAILABLE' as any,
    attendance: 'PRESENT' as any
  });

  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: api.drivers.list });
  
  const createMutation = useMutation({
    mutationFn: api.drivers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsAdding(false);
      setFormData({
        name: '',
        licenseNumber: '',
        licenseCategory: 'HMV',
        licenseExpiry: '',
        contactNumber: '',
        safetyScore: 90,
        status: 'AVAILABLE',
        attendance: 'PRESENT'
      });
      toast.success('Driver registered successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create driver (Check permissions)');
    }
  });

  const selectedDriver = drivers?.find(d => d.id === selectedId);

  const filteredDrivers = drivers?.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenseNumber.includes(searchTerm)
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      
      {/* 1. Left List View */}
      <div className="w-full lg:w-[350px] bg-card border border-border rounded-lg flex flex-col shrink-0">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Drivers Registry</h3>
            {canCreate && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 text-[11px] bg-foreground text-background px-2.5 py-1.5 rounded font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Driver</span>
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Search driver by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-muted text-xs border border-border rounded-md outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filteredDrivers?.map(d => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedId(d.id);
                setIsAdding(false);
              }}
              className={`w-full p-4 text-left flex items-center justify-between transition-all ${
                selectedId === d.id && !isAdding ? 'bg-muted/80' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-medium text-xs border border-border text-primary">
                  {d.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.licenseCategory}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold ${
                  d.safetyScore >= 90 ? 'text-green-500' : d.safetyScore >= 80 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {d.safetyScore} pts
                </span>
                <p className="text-[9px] text-muted-foreground mt-0.5">{d.status}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Right Detail Panel */}
      <div className="flex-1 bg-card border border-border rounded-lg flex flex-col min-w-0">
        {isAdding ? (
          <form onSubmit={handleCreate} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Register Driver Profile</h3>
              <p className="text-[11px] text-muted-foreground">Log a driver license profile and assign a default status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">License Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-339240"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">License Category</label>
                <select
                  value={formData.licenseCategory}
                  onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                >
                  <optgroup label="Transport / Commercial">
                    <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                    <option value="LMV-TR">LMV-TR (Light Motor Vehicle - Transport)</option>
                    <option value="CDL">CDL (Commercial Driving Licence)</option>
                  </optgroup>
                  <optgroup label="Personal / Non-Transport">
                    <option value="LMV-NT">LMV-NT (Light Motor Vehicle - Non-Transport)</option>
                    <option value="MCWG">MCWG (Motorcycles with gear)</option>
                    <option value="MCWOG">MCWOG / FVG (Motorcycles without gear)</option>
                    <option value="MC 50cc">MC 50cc (Motorcycles up to 50cc)</option>
                  </optgroup>
                  <optgroup label="Other Permits">
                    <option value="LL">LL (Learner's Licence)</option>
                    <option value="DL">DL (Permanent Driving Licence)</option>
                    <option value="IDP">IDP (International Driving Permit)</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">License Expiry Date</label>
                <input
                  type="date"
                  required
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 (555) 012-3456"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Safety Score Rating</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.safetyScore}
                  onChange={(e) => setFormData({ ...formData, safetyScore: Number(e.target.value) })}
                  className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-transparent border border-border rounded font-semibold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-foreground text-background rounded font-semibold hover:opacity-90 transition-all shadow"
              >
                Register Driver
              </button>
            </div>
          </form>
        ) : selectedDriver ? (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Header Profiler */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center font-bold text-lg text-primary border border-border">
                  {selectedDriver.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedDriver.name}</h2>
                  <p className="text-xs text-muted-foreground">ID: {selectedDriver.id} · Category: <span className="font-semibold text-foreground">{selectedDriver.licenseCategory}</span></p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
                    <span className={`h-2 w-2 rounded-full ${selectedDriver.attendance === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'}`} />
                    Duty Status: {selectedDriver.attendance} ({selectedDriver.status})
                  </p>
                </div>
              </div>

              {/* Safety Score visual block */}
              <div className="bg-muted/40 border border-border p-4 rounded-lg flex items-center gap-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Safety Rating</span>
                  <span className={`text-xl font-extrabold ${selectedDriver.safetyScore >= 90 ? 'text-green-500' : 'text-yellow-500'}`}>{selectedDriver.safetyScore}%</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>

            {/* Profile specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliance details</h3>
                <div className="divide-y divide-border/60">
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> License Expiration</span>
                    <span className="font-medium text-foreground">{selectedDriver.licenseExpiry}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1.5"><UserSquare className="h-3.5 w-3.5" /> License Number</span>
                    <span className="font-mono text-foreground font-semibold">{selectedDriver.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Contact Phone</span>
                    <span className="font-medium text-foreground">{selectedDriver.contactNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-muted/20 p-4 border border-border rounded-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historical Performance</h3>
                <div className="divide-y divide-border/40 text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Map className="h-3.5 w-3.5" /> Total Trips Completed</span>
                    <span className="font-bold text-foreground">{selectedDriver.tripsCount}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><AlertOctagon className="h-3.5 w-3.5 text-red-500" /> Speeding/Safety Violations</span>
                    <span className="font-bold text-red-500">{selectedDriver.violations}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Performance Level</span>
                    <span className="font-semibold text-green-500">Exemplary</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document lockers for license uploads */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Certified Driver Permits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded bg-muted/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Commercial Driver License.pdf</p>
                    <p className="text-[10px] text-muted-foreground">Active CDL copy</p>
                  </div>
                  <button className="text-primary hover:underline font-semibold">View</button>
                </div>
                <div className="p-3 border border-border rounded bg-muted/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Medical Evaluation certificate.pdf</p>
                    <p className="text-[10px] text-muted-foreground">Expires: 2027-02</p>
                  </div>
                  <button className="text-primary hover:underline font-semibold">View</button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Select a driver profile from the registry to view performance.
          </div>
        )}
      </div>

    </div>
  );
};
