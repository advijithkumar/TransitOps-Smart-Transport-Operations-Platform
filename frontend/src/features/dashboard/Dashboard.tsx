import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Truck, 
  Users, 
  Briefcase, 
  Wrench, 
  TrendingUp, 
  AlertTriangle, 
  Compass, 
  Gauge 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const chartData = [
  { name: 'Jan', revenue: 45000, expenses: 32000, fuel: 9500 },
  { name: 'Feb', revenue: 52000, expenses: 35000, fuel: 11000 },
  { name: 'Mar', revenue: 49000, expenses: 31000, fuel: 9800 },
  { name: 'Apr', revenue: 58000, expenses: 38000, fuel: 12000 },
  { name: 'May', revenue: 63000, expenses: 40000, fuel: 12500 },
  { name: 'Jun', revenue: 69000, expenses: 42000, fuel: 13000 },
  { name: 'Jul', revenue: 72000, expenses: 44000, fuel: 13500 }
];

export const Dashboard: React.FC = () => {
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list });
  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: api.drivers.list });
  const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: api.trips.list });
  const { data: maintenance } = useQuery({ queryKey: ['maintenance'], queryFn: api.maintenance.list });

  // Calculate high quality KPIs
  const totalVehicles = vehicles?.length || 0;
  const vehiclesOnline = vehicles?.filter(v => v.status === 'ON_TRIP').length || 0;
  const vehiclesAvailable = vehicles?.filter(v => v.status === 'AVAILABLE').length || 0;
  const vehiclesMaintenance = vehicles?.filter(v => v.status === 'MAINTENANCE').length || 0;

  const totalDrivers = drivers?.length || 0;
  const driversAvailable = drivers?.filter(d => d.status === 'AVAILABLE').length || 0;
  const averageSafety = drivers 
    ? Math.round(drivers.reduce((acc, curr) => acc + curr.safetyScore, 0) / drivers.length)
    : 100;

  const activeTrips = trips?.filter(t => t.status === 'ON_TRIP').length || 0;
  const completedTrips = trips?.filter(t => t.status === 'COMPLETED').length || 0;
  const totalRevenue = trips?.reduce((acc, t) => acc + t.revenue, 0) || 0;

  const activeMaintenance = maintenance?.filter(m => m.status === 'IN_PROGRESS').length || 0;

  return (
    <div className="space-y-6">
      
      {/* Welcome Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Operations Dashboard</h2>
          <p className="text-xs text-muted-foreground">Real-time status metrics and critical fleet alerts overview.</p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-md font-semibold">
          System Time: 14:52 (UTC +5:30)
        </div>
      </div>

      {/* Grid of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Vehicles summary card */}
        <div className="bg-card border border-border p-5 rounded-lg flex items-center justify-between shadow-sm hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider block">Fleet Assets</span>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{totalVehicles}</h3>
            <p className="text-[11px] text-muted-foreground font-light mt-1">
              <span className="text-green-600 dark:text-green-400 font-bold">{vehiclesAvailable}</span> available · <span className="font-semibold text-foreground">{vehiclesOnline}</span> active
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg flex items-center justify-center odoo-icon-container odoo-icon-vehicles shadow-sm shrink-0">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        {/* Drivers Card */}
        <div className="bg-card border border-border p-5 rounded-lg flex items-center justify-between shadow-sm hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider block">Active Drivers</span>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{totalDrivers}</h3>
            <p className="text-[11px] text-muted-foreground font-light mt-1">
              <span className="text-primary font-bold">{driversAvailable}</span> idle · Safety: <span className="font-bold text-foreground">{averageSafety}%</span>
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg flex items-center justify-center odoo-icon-container odoo-icon-drivers shadow-sm shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Trips summary card */}
        <div className="bg-card border border-border p-5 rounded-lg flex items-center justify-between shadow-sm hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider block">Active Trips</span>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{activeTrips}</h3>
            <p className="text-[11px] text-muted-foreground font-light mt-1">
              <span className="text-primary font-bold">{completedTrips}</span> completed total
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg flex items-center justify-center odoo-icon-container odoo-icon-dispatch shadow-sm shrink-0">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Maintenance summary card */}
        <div className="bg-card border border-border p-5 rounded-lg flex items-center justify-between shadow-sm hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider block">Maintenance</span>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{vehiclesMaintenance}</h3>
            <p className="text-[11px] text-muted-foreground font-light mt-1">
              <span className="text-red-500 font-bold">{activeMaintenance}</span> in workshop · <span className="font-semibold text-foreground">{maintenance?.filter(m => m.status === 'SCHEDULED').length || 0}</span> scheduled
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg flex items-center justify-center odoo-icon-container odoo-icon-maint shadow-sm shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Revenue vs Fleet Expenditures</h3>
              <p className="text-[11px] text-muted-foreground">Monthly profit and operating cost parameters.</p>
            </div>
            <div className="text-xs font-semibold text-primary">
              YTD Revenue: ₹{totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="red" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="red" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  labelStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--foreground)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="4 4" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Mini Map Telemetry Feed */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Active Fleet Coordinates</h3>
            <p className="text-[11px] text-muted-foreground">Mock live locations overlay.</p>
          </div>
          <div className="flex-1 bg-muted rounded-md border border-border flex items-center justify-center p-4 relative overflow-hidden h-48 lg:h-auto">
            {/* Simple Grid / Map simulation */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20 pointer-events-none">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-border/80" />
              ))}
            </div>
            {/* Animated vehicles points */}
            {vehicles?.filter(v => v.status === 'ON_TRIP').map((v, i) => (
              <div 
                key={v.id} 
                className="absolute flex flex-col items-center"
                style={{ top: `${30 + i * 20}%`, left: `${25 + i * 25}%` }}
              >
                <div className="h-3 w-3 rounded-full bg-primary border-2 border-background animate-pulse" />
                <span className="text-[8px] bg-card border border-border px-1 rounded mt-1 font-semibold">{v.registrationNumber}</span>
              </div>
            ))}
            <div className="z-10 text-center space-y-2">
              <Compass className="h-8 w-8 mx-auto text-muted-foreground animate-spin" style={{ animationDuration: '8s' }} />
              <Link 
                to="/tracking" 
                className="inline-block text-[11px] bg-foreground text-background hover:opacity-90 px-3 py-1.5 rounded font-semibold transition-all shadow"
              >
                Open Full Tracking Screen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Trips List & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dispatch status feed */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Active Dispatches</h3>
            <p className="text-[11px] text-muted-foreground">Ongoing routes currently being logged.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 font-bold">Trip ID</th>
                  <th className="py-2.5 font-bold">Route</th>
                  <th className="py-2.5 font-bold">Vehicle</th>
                  <th className="py-2.5 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Distance</th>
                </tr>
              </thead>
              <tbody>
                {trips?.slice(0, 3).map(t => {
                  const vehicle = vehicles?.find(v => v.id === t.vehicleId);
                  return (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-muted/10 last:border-0">
                      <td className="py-2.5 font-medium">{t.id}</td>
                      <td className="py-2.5 text-muted-foreground">{t.source} &rarr; {t.destination}</td>
                      <td className="py-2.5 font-medium">{vehicle?.registrationNumber || 'Pending'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'ON_TRIP' 
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                            : t.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold">{t.plannedDistance} km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time activity logs */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Recent Activity Feed</h3>
            <p className="text-[11px] text-muted-foreground">Operational log updates.</p>
          </div>
          <div className="space-y-3">
            {[
              { text: 'Trip t-001 created successfully.', time: '10m ago' },
              { text: 'Volvo FH16 (v-001) dispatched by dispatcher.', time: '14m ago' },
              { text: 'Fuel refilled: 240L at Pilot J Station.', time: '1h ago' },
              { text: 'Sarah Jenkins status updated to On-Trip.', time: '3h ago' }
            ].map((act, i) => (
              <div key={i} className="flex justify-between items-start gap-2 text-[11px] border-b border-border/20 pb-2 last:border-0">
                <span className="text-muted-foreground">{act.text}</span>
                <span className="text-[9px] text-muted-foreground/60 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
