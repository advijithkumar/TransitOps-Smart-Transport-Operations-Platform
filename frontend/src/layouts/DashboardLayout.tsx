import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  useAuthStore,
  UserRole
} from '../store/authStore';
import { useTheme, useSocket } from '../app/providers';
import { toast, Toaster } from 'sonner';
import {
  LayoutDashboard,
  Truck,
  Users,
  Settings,
  MapPin,
  CalendarDays,
  Fuel,
  CreditCard,
  BarChart3,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  UserSquare,
  ShieldAlert,
  Briefcase,
  Layers,
  Menu,
  X
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeRole, logout, setActiveRole } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string }>>([
    { id: '1', title: 'Route Alert', message: 'Vehicle TX-9842-A deviated from geofence boundary.', time: '5m ago' },
    { id: '2', title: 'Maintenance Pending', message: 'Inspection due for Ford F-550 within 48 hours.', time: '1h ago' }
  ]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Listen to Socket.IO real-time alert events
  useEffect(() => {
    if (!socket) return;

    const handleAlert = (data: { title: string; message: string }) => {
      toast.warning(`${data.title}: ${data.message}`, {
        duration: 5000,
        position: 'top-right'
      });
      setNotifications(prev => [
        {
          id: String(Date.now()),
          title: data.title,
          message: data.message,
          time: 'Just now'
        },
        ...prev
      ]);
    };

    socket.on('system:alert', handleAlert);
    socket.on('gps:location-update', (data) => {
      console.log('GPS movement broadcast received:', data);
    });

    return () => {
      socket.off('system:alert', handleAlert);
      socket.off('gps:location-update');
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getOdooIconClass = (name: string) => {
    switch (name) {
      case 'Dashboard': return 'odoo-icon-dashboard';
      case 'Vehicles': return 'odoo-icon-vehicles';
      case 'Drivers': return 'odoo-icon-drivers';
      case 'Dispatch Console': return 'odoo-icon-dispatch';
      case 'Live Tracking': return 'odoo-icon-tracking';
      case 'Service logs': return 'odoo-icon-maint';
      case 'Fuel Audits': return 'odoo-icon-fuel';
      case 'Expenses': return 'odoo-icon-expenses';
      case 'Analytics & ROI': return 'odoo-icon-analytics';
      case 'System Settings': return 'odoo-icon-settings';
      default: return 'odoo-icon-settings';
    }
  };

  const sections: SidebarSection[] = [
    {
      title: 'General',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Fleet Assets',
      items: [
        { name: 'Vehicles', path: '/vehicles', icon: Truck },
        { name: 'Drivers', path: '/drivers', icon: Users }
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Dispatch Console', path: '/dispatch', icon: Briefcase },
        { name: 'Live Tracking', path: '/tracking', icon: MapPin }
      ]
    },
    {
      title: 'Maintenance',
      items: [
        { name: 'Service logs', path: '/maintenance', icon: CalendarDays },
        { name: 'Fuel Audits', path: '/fuel', icon: Fuel },
        { name: 'Expenses', path: '/expenses', icon: CreditCard }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { name: 'Analytics & ROI', path: '/analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'System Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  const rolesList: { name: string; value: UserRole; desc: string }[] = [
    { name: 'Fleet Manager', value: 'FLEET_MANAGER', desc: 'Oversees assets and logs' },
    { name: 'Dispatcher', value: 'DISPATCHER', desc: 'Controls routes and schedules' },
    { name: 'Safety Officer', value: 'SAFETY_OFFICER', desc: 'Monitors telemetry and driver scores' },
    { name: 'Financial Analyst', value: 'FINANCIAL_ANALYST', desc: 'Tracks costs and analytics' }
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      <Toaster closeButton richColors />

      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 shrink-0">
        {/* Workspace Brand Selector */}
        <div className="h-16 flex items-center px-6 border-b border-border gap-2 bg-[#714B67] text-white">
          <div className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-lg">
            TO
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-sm text-white">TransitOps</h1>
            <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Enterprise ERP</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="px-3 text-[9px] uppercase font-bold tracking-wider text-muted-foreground/75">
                {section.title}
              </h3>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 text-xs rounded-md transition-all ${isActive
                        ? 'bg-secondary text-primary border border-border shadow-sm font-bold'
                        : 'text-muted-foreground font-light hover:bg-muted hover:text-foreground hover:font-normal'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 odoo-icon-container ${getOdooIconClass(item.name)}`}>
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar User Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-medium text-xs text-primary border border-border">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="truncate w-28">
                <p className="text-xs font-semibold truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@transitops.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm">
          <div className="w-64 bg-card border-r border-border h-full flex flex-col p-4">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <span className="font-semibold text-sm">TransitOps Mobile</span>
              <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-4">
              {sections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{section.title}</span>
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs rounded-md text-muted-foreground hover:bg-secondary hover:text-primary transition-all"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* 2. Main Page Layout Frame */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Toolbar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between gap-4">

          {/* Mobile toggle & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 hover:bg-secondary rounded-md"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Workspace</span>
              <span>/</span>
              <span className="capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</span>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="flex items-center gap-4">

            {/* Real-time active role switcher for easy demo and permission testing */}
            {/* <div className="flex items-center gap-1.5 bg-muted p-1 rounded-md border border-border">
              <Layers className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
              <select
                value={activeRole || 'FLEET_MANAGER'}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-transparent text-[11px] font-semibold text-foreground outline-none border-none cursor-pointer pr-4"
              >
                {rolesList.map(r => (
                  <option key={r.value} value={r.value}>{r.name}</option>
                ))}
              </select>
            </div> */}

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications system */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground relative transition-all"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-card" />
                )}
              </button>

              {/* Notification Box */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold">Active Alerts</span>
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No critical alerts pending.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-4 py-2.5 hover:bg-muted/40 border-b border-border/50 last:border-b-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              {n.title}
                            </h4>
                            <span className="text-[9px] text-muted-foreground shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
