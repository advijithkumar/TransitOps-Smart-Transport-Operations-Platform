import React, { useState } from 'react';
import { useTheme } from '../../app/providers';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { 
  Building2, 
  Key, 
  Bell, 
  Palette, 
  Globe, 
  Server, 
  Shield, 
  Save 
} from 'lucide-react';

type SettingSection = 'company' | 'api' | 'notifications' | 'theme' | 'server';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, activeRole } = useAuthStore();
  const [activeSection, setActiveSection] = useState<SettingSection>('company');

  const [companyName, setCompanyName] = useState('TransitOps Enterprise Logistics');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [apiKey, setApiKey] = useState('to_prod_sk_9f8a2c1e4b7d3f0e6a9c2b5d8e1f4a7b');

  const handleSave = () => {
    toast.success('Settings saved successfully.');
  };

  const sections: { id: SettingSection; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'api', label: 'API Keys & Integrations', icon: Key },
    { id: 'notifications', label: 'Notification Rules', icon: Bell },
    { id: 'theme', label: 'Appearance & Theme', icon: Palette },
    { id: 'server', label: 'Server Configuration', icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">System Settings</h2>
        <p className="text-xs text-muted-foreground">Configure workspace preferences, integrations, and notification channels.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Sidebar nav */}
        <div className="w-full bg-card border border-border rounded-lg p-3 flex flex-wrap gap-2 shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeSection === s.id
                  ? 'bg-secondary text-primary border border-border shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 bg-card border border-border rounded-lg p-6 space-y-6">

          {/* Company Profile */}
          {activeSection === 'company' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Organization Profile</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Update workspace name, timezone, and default locale settings.</p>
              </div>
              <div className="flex flex-col gap-5 max-w-md">
                <div className="space-y-1.5">
                  <label className="font-semibold">Company / Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Default System Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="America/New_York">America/New_York (EST -5)</option>
                    <option value="Europe/London">Europe/London (GMT +0)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST -8)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Primary Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-md outline-none"
                  >
                    <option value="INR">INR — Indian Rupee</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Active User Role</label>
                  <div className="p-2.5 bg-muted border border-border rounded-md font-mono font-semibold text-foreground">
                    {activeRole || 'ADMIN'}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded text-xs font-semibold hover:opacity-90 transition-all shadow">
                  <Save className="h-3.5 w-3.5" />
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeSection === 'api' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">API Keys & External Integrations</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Manage API tokens for third-party logistics providers, GPS hardware, and webhook endpoints.</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">TransitOps Production API Key</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Full read/write access to your fleet workspace.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[9px] font-bold">ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      readOnly
                      className="flex-1 p-2.5 bg-muted border border-border rounded font-mono outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                        toast.success('API key copied to clipboard.');
                      }}
                      className="px-3 py-2.5 bg-secondary border border-border rounded font-semibold hover:bg-muted transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Socket.IO & MQTT Configuration</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Real-time telemetry broker connection strings.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[9px] font-bold">CONNECTED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Socket.IO Endpoint</label>
                      <div className="p-2 bg-muted border border-border rounded font-mono text-foreground">ws://localhost:3000</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">MQTT Broker URL</label>
                      <div className="p-2 bg-muted border border-border rounded font-mono text-foreground">mqtt://localhost:1883</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Notification Rules & Channels</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Configure when and how alerts are delivered to operators.</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'License Expiry Alert (30 days)', desc: 'Notify fleet manager when driver CDL expires within 30 days.', enabled: true },
                  { label: 'Vehicle Maintenance Due', desc: 'Send alert when a scheduled inspection is overdue.', enabled: true },
                  { label: 'Geofence Boundary Breach', desc: 'Notify dispatcher when vehicle exits a geofence boundary.', enabled: true },
                  { label: 'Trip Completed Summary', desc: 'Email report when each dispatched trip is marked complete.', enabled: false },
                  { label: 'Low Fuel Warning', desc: 'Alert when any vehicle fuel level drops below 20%.', enabled: true },
                ].map((rule, i) => (
                  <div key={i} className="p-4 border border-border rounded-lg flex items-start justify-between gap-4 hover:bg-muted/10 transition-all">
                    <div>
                      <p className="font-semibold text-foreground">{rule.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{rule.desc}</p>
                    </div>
                    <div className={`h-5 w-9 rounded-full flex items-center transition-all cursor-pointer shrink-0 ${rule.enabled ? 'bg-foreground' : 'bg-muted border border-border'}`}>
                      <div className={`h-3.5 w-3.5 rounded-full bg-background shadow transition-all mx-0.5 ${rule.enabled ? 'ml-auto mr-0.5' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded text-xs font-semibold hover:opacity-90 transition-all shadow">
                  <Save className="h-3.5 w-3.5" />
                  Save Rules
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'theme' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Appearance & Interface Theme</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Select the global display mode for the TransitOps ERP interface.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`p-5 rounded-lg border-2 text-left transition-all ${
                    theme === 'dark' ? 'border-foreground shadow-lg bg-zinc-950' : 'border-border hover:border-muted-foreground bg-muted/20'
                  }`}
                >
                  <div className="h-20 rounded-md bg-zinc-950 border border-zinc-800 mb-3 p-3 space-y-2">
                    <div className="h-2 w-1/2 bg-zinc-700 rounded" />
                    <div className="h-1.5 w-3/4 bg-zinc-800 rounded" />
                    <div className="h-1.5 w-2/3 bg-zinc-800 rounded" />
                  </div>
                  <p className="font-bold text-foreground">Dark Mode</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recommended for extended dispatcher use in low-light environments.</p>
                </button>
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`p-5 rounded-lg border-2 text-left transition-all ${
                    theme === 'light' ? 'border-foreground shadow-lg bg-slate-50' : 'border-border hover:border-muted-foreground bg-muted/20'
                  }`}
                >
                  <div className="h-20 rounded-md bg-white border border-slate-200 mb-3 p-3 space-y-2">
                    <div className="h-2 w-1/2 bg-slate-200 rounded" />
                    <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                    <div className="h-1.5 w-2/3 bg-slate-100 rounded" />
                  </div>
                  <p className="font-bold text-foreground">Light Mode</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Clean interface for daytime office and management report reviews.</p>
                </button>
              </div>
            </div>
          )}

          {/* Server Config */}
          {activeSection === 'server' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Server & Infrastructure Status</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Monitor backend service health and connection diagnostics.</p>
              </div>
              <div className="space-y-3">
                {[
                  { service: 'PostgreSQL Database (PostGIS)', endpoint: 'localhost:5433', status: 'HEALTHY' },
                  { service: 'Redis Cache Layer', endpoint: 'localhost:6379', status: 'HEALTHY' },
                  { service: 'Socket.IO WebSocket', endpoint: 'ws://localhost:3000', status: 'CONNECTED' },
                  { service: 'MQTT Telemetry Broker', endpoint: 'mqtt://localhost:1883', status: 'SUBSCRIBED' },
                  { service: 'BullMQ Worker Queues', endpoint: '4 active workers', status: 'RUNNING' },
                ].map((s, i) => (
                  <div key={i} className="p-4 border border-border rounded-lg flex items-center justify-between bg-muted/10">
                    <div>
                      <p className="font-semibold text-foreground">{s.service}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.endpoint}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[9px] font-bold">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
