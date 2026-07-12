import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  Plus, 
  Fuel, 
  CreditCard, 
  TrendingDown, 
  Calculator, 
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export const FuelExpenses: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [quantity, setQuantity] = useState(150);
  const [cost, setCost] = useState(250);
  const [station, setStation] = useState('');
  const [category, setCategory] = useState<'Tolls' | 'Parking' | 'Insurance' | 'Permits' | 'Emergency Repair'>('Tolls');
  const [description, setDescription] = useState('');

  // Queries
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuel'], queryFn: api.fuel.list });
  const { data: expenseLogs } = useQuery({ queryKey: ['expenses'], queryFn: api.expenses.list });

  // Mutations
  const createFuelMutation = useMutation({
    mutationFn: api.fuel.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      toast.success('Fuel log added successfully.');
      setIsAdding(false);
      setVehicleId('');
      setStation('');
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: api.expenses.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense log recorded.');
      setIsAdding(false);
      setVehicleId('');
      setDescription('');
    }
  });

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.error('Choose a vehicle.');
      return;
    }
    createFuelMutation.mutate({
      vehicleId,
      quantity,
      cost,
      station,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.error('Choose a vehicle.');
      return;
    }
    createExpenseMutation.mutate({
      vehicleId,
      category,
      amount: cost, // reuse cost state variable
      description,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Math calculators
  const totalFuelCost = fuelLogs?.reduce((acc, f) => acc + f.cost, 0) || 0;
  const totalExpenseCost = expenseLogs?.reduce((acc, e) => acc + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Fuel & Expenses Audits</h2>
          <p className="text-xs text-muted-foreground">Monitor fleet fuel economy metrics and record toll expenses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('fuel'); setIsAdding(false); }}
            className={`text-xs px-3.5 py-1.5 rounded font-semibold border ${
              activeTab === 'fuel' 
                ? 'bg-secondary text-primary border-border' 
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            Fuel Logs
          </button>
          <button
            onClick={() => { setActiveTab('expenses'); setIsAdding(false); }}
            className={`text-xs px-3.5 py-1.5 rounded font-semibold border ${
              activeTab === 'expenses' 
                ? 'bg-secondary text-primary border-border' 
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            Expenses Logs
          </button>
        </div>
      </div>

      {/* Aggregate metrics header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Fuel Costs Audited</span>
            <h3 className="text-xl font-bold">₹{totalFuelCost.toLocaleString()}</h3>
            <p className="text-[10px] text-muted-foreground">Average fuel price: ₹89.50 / Liter</p>
          </div>
          <Fuel className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Operational Expenses</span>
            <h3 className="text-xl font-bold">₹{totalExpenseCost.toLocaleString()}</h3>
            <p className="text-[10px] text-muted-foreground">Tolls, Permits, parking tickets, emergency garage repairs</p>
          </div>
          <CreditCard className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm">
        
        {/* Table/Form header toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {activeTab === 'fuel' ? 'Refueling logs' : 'Incidental expenditures'}
          </h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 py-1.5 rounded font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Record Entry</span>
          </button>
        </div>

        {/* Record form panel */}
        {isAdding && (
          <div className="p-6 border-b border-border bg-muted/20">
            {activeTab === 'fuel' ? (
              <form onSubmit={handleFuelSubmit} className="space-y-4 text-xs">
                <h4 className="font-semibold text-sm">Log Fuel Dispensation Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold">Truck Registration</label>
                    <select
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    >
                      <option value="">-- Choose --</option>
                      {vehicles?.map(v => (
                        <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Volume Refilled (Liters)</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Total Cost (USD)</label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Fuel Station Vendor</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Love's #204"
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-3.5 py-1.5 border border-border rounded hover:bg-muted font-semibold">Cancel</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-foreground text-background rounded hover:opacity-90 font-semibold shadow">Record Refill</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
                <h4 className="font-semibold text-sm">Record Fleet Incident Cost</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold">Truck Registration</label>
                    <select
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    >
                      <option value="">-- Choose --</option>
                      {vehicles?.map(v => (
                        <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Expense category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    >
                      <option value="Tolls">Tolls</option>
                      <option value="Parking">Parking</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Permits">Permits</option>
                      <option value="Emergency Repair">Emergency Repair</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Expenditure Amount (USD)</label>
                    <input
                      type="number"
                      value={cost} // reuse cost state variable
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Short descriptions</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Toll charges on interstate route"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-3.5 py-1.5 border border-border rounded hover:bg-muted font-semibold">Cancel</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-foreground text-background rounded hover:opacity-90 font-semibold shadow">Record expense</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Data visual tables */}
        <div className="overflow-x-auto">
          {activeTab === 'fuel' ? (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                  <th className="p-4">Refill Date</th>
                  <th className="p-4">Vehicle ID</th>
                  <th className="p-4">Volume (Liters)</th>
                  <th className="p-4">Total Cost</th>
                  <th className="p-4">Station Location</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs?.map(f => {
                  const vehicle = vehicles?.find(v => v.id === f.vehicleId);
                  return (
                    <tr key={f.id} className="border-b border-border last:border-b-0 hover:bg-muted/10">
                      <td className="p-4 font-semibold">{f.date}</td>
                      <td className="p-4 font-medium text-foreground">{vehicle?.registrationNumber || 'Deleted'}</td>
                      <td className="p-4 font-semibold">{f.quantity} L</td>
                      <td className="p-4 font-bold text-foreground">₹{f.cost}</td>
                      <td className="p-4 text-muted-foreground">{f.station}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                  <th className="p-4">Date</th>
                  <th className="p-4">Vehicle ID</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Description details</th>
                </tr>
              </thead>
              <tbody>
                {expenseLogs?.map(e => {
                  const vehicle = vehicles?.find(v => v.id === e.vehicleId);
                  return (
                    <tr key={e.id} className="border-b border-border last:border-b-0 hover:bg-muted/10">
                      <td className="p-4 font-semibold">{e.date}</td>
                      <td className="p-4 font-medium text-foreground">{vehicle?.registrationNumber || 'Deleted'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded bg-muted font-bold text-[10px] text-foreground border border-border">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-foreground">₹{e.amount.toFixed(2)}</td>
                      <td className="p-4 text-muted-foreground">{e.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
