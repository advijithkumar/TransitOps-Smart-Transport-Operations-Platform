import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { 
  Gauge, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  MapPin, 
  FileSpreadsheet 
} from 'lucide-react';
import { toast } from 'sonner';

const utilizationData = [
  { name: 'Volvo FH16', rate: 82 },
  { name: 'Freight Cascadia', rate: 74 },
  { name: 'Ford F-550', rate: 45 },
  { name: 'Tesla Semi', rate: 91 },
  { name: 'MB Sprinter', rate: 68 },
  { name: 'Scania R500', rate: 12 }
];

const costPerKmData = [
  { week: 'W1', cost: 1.12 },
  { week: 'W2', cost: 1.08 },
  { week: 'W3', cost: 1.15 },
  { week: 'W4', cost: 1.05 },
  { week: 'W5', cost: 0.98 },
  { week: 'W6', cost: 1.02 },
  { week: 'W7', cost: 0.94 }
];

export const Analytics: React.FC = () => {
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list });
  const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: api.trips.list });

  // Calculate efficiency metrics
  const totalKm = trips?.filter(t => t.status === 'COMPLETED').reduce((acc, t) => acc + (t.actualDistance || 0), 0) || 1200;
  const totalRevenue = trips?.reduce((acc, t) => acc + t.revenue, 0) || 5400;
  const avgCostPerKm = 1.02; // simulated dollar value
  const roiMultiplier = 2.4; // simulated multiplier index

  const handleExport = (format: string) => {
    toast.success(`Exporting fleet metrics database to ${format} file...`);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Intelligence & Analytics</h2>
          <p className="text-xs text-muted-foreground">Deep analysis on ROI margins, cost-per-kilometer, and vehicle idle times.</p>
        </div>
        
        {/* Export triggers */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold mr-1">Export:</span>
          {['CSV', 'Excel', 'PDF'].map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1 text-[10px] bg-muted border border-border px-2.5 py-1.5 rounded font-bold hover:bg-secondary transition-all"
            >
              <FileSpreadsheet className="h-3 w-3" />
              <span>{fmt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Average Cost per KM</span>
          <h3 className="text-lg font-bold">₹{avgCostPerKm.toFixed(2)}</h3>
          <p className="text-[10px] text-muted-foreground">Target: &lt; ₹1.10 / km</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Return on Investment (ROI)</span>
          <h3 className="text-lg font-bold">{roiMultiplier}x</h3>
          <p className="text-[10px] text-muted-foreground">Capital expenditure efficiency</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Fleet Utilization Rate</span>
          <h3 className="text-lg font-bold">78.4%</h3>
          <p className="text-[10px] text-muted-foreground">Active runtime vs idle states</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Total Distance Logged</span>
          <h3 className="text-lg font-bold">{totalKm.toLocaleString()} km</h3>
          <p className="text-[10px] text-muted-foreground">Over last 30 operational days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Utilization Bar Chart */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Asset Runtime Utilization Rate (%)</h3>
            <p className="text-[11px] text-muted-foreground">Inspection of vehicle active dispatch rates.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', fontSize: '11px' }} />
                <Bar dataKey="rate" fill="var(--foreground)" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost per KM Line Chart */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Operating Cost Trend per Kilometer</h3>
            <p className="text-[11px] text-muted-foreground">Weekly average of fuel & maintenance metrics divided by distance.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costPerKmData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="cost" stroke="var(--foreground)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
