import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useSocket, useTheme } from '../../app/providers';
import { Vehicle } from '../../services/mockData';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Gauge, 
  Fuel, 
  Clock, 
  Activity, 
  Navigation, 
  ShieldAlert, 
  Info 
} from 'lucide-react';

export const Tracking: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  
  const socket = useSocket();
  const { theme } = useTheme();

  const [activeVehicleId, setActiveVehicleId] = useState<string>('v-001');

  // Queries
  const { data: vehicles, refetch: refetchVehicles } = useQuery({ 
    queryKey: ['vehicles'], 
    queryFn: api.vehicles.list 
  });

  const selectedVehicle = vehicles?.find(v => v.id === activeVehicleId);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // CartoDB Dark Matter vs Positron based on active system theme
    const styleUrl = theme === 'dark' 
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3.5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [theme]);

  // Update/draw vehicle markers on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !vehicles) return;

    // Clear old markers that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!vehicles.find(v => v.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Draw/update current markers
    vehicles.forEach(v => {
      // Create HTML element for the marker to look custom/minimal
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = v.status === 'ON_TRIP' ? 'var(--foreground)' : 'var(--muted-foreground)';
      el.style.border = '2px solid var(--background)';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

      // On click, make it the active vehicle inspect focus
      el.addEventListener('click', () => {
        setActiveVehicleId(v.id);
        map.flyTo({ center: [v.longitude, v.latitude], zoom: 10 });
      });

      if (markersRef.current[v.id]) {
        // Update coordinates
        markersRef.current[v.id].setLngLat([v.longitude, v.latitude]);
      } else {
        // Add new marker
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([v.longitude, v.latitude])
          .addTo(map);
        markersRef.current[v.id] = marker;
      }
    });
  }, [vehicles]);

  // Listen to live GPS Socket.IO coordinate streams
  useEffect(() => {
    if (!socket) return;

    const handleGpsUpdate = (data: { deviceId: string; vehicleId: string; latitude: number; longitude: number; speed: number }) => {
      console.log('Live GPS packet received via Socket.IO:', data);
      
      // Update vehicle in localStorage cache and trigger TanStack Query reload
      api.vehicles.update(data.vehicleId, {
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed
      }).then(() => {
        refetchVehicles();
        
        // If this vehicle is inspected, pan the map
        if (data.vehicleId === activeVehicleId && mapRef.current) {
          mapRef.current.easeTo({ center: [data.longitude, data.latitude] });
        }
      });
    };

    socket.on('gps:location-update', handleGpsUpdate);

    return () => {
      socket.off('gps:location-update', handleGpsUpdate);
    };
  }, [socket, activeVehicleId, refetchVehicles]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row border border-border rounded-lg overflow-hidden bg-card">
      
      {/* 1. Map Panel */}
      <div className="flex-1 relative min-h-[300px]">
        <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
        
        {/* Floating map status overlay */}
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur border border-border px-3 py-2 rounded shadow-lg text-xs space-y-1 z-10 max-w-xs">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-ping" />
            Live Dispatch Room Connect
          </p>
          <p className="text-[10px] text-muted-foreground">Map rendering OpenStreetMap vector tiles via MapLibre GL.</p>
        </div>
      </div>

      {/* 2. Side telemetry metadata panel */}
      <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-border flex flex-col bg-card shrink-0">
        
        {/* Vehicles selection selector list */}
        <div className="p-4 border-b border-border">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">Select Vehicle to Track</label>
          <select
            value={activeVehicleId}
            onChange={(e) => {
              const id = e.target.value;
              setActiveVehicleId(id);
              const v = vehicles?.find(item => item.id === id);
              if (v && mapRef.current) {
                mapRef.current.flyTo({ center: [v.longitude, v.latitude], zoom: 9 });
              }
            }}
            className="w-full p-2 bg-muted text-xs border border-border rounded outline-none text-foreground font-semibold"
          >
            {vehicles?.map(v => (
              <option key={v.id} value={v.id}>{v.registrationNumber} ({v.name})</option>
            ))}
          </select>
        </div>

        {/* Telemetry variables block */}
        {selectedVehicle ? (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto text-xs">
            <div>
              <span className="text-[9px] bg-muted border border-border px-2 py-0.5 rounded font-bold uppercase">{selectedVehicle.type}</span>
              <h3 className="text-sm font-bold text-foreground mt-2">{selectedVehicle.name}</h3>
              <p className="text-xs text-muted-foreground">Odometer: {selectedVehicle.odometer.toLocaleString()} km</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-border rounded bg-muted/10">
                <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> Velocity</span>
                <span className="text-sm font-extrabold mt-1 block">{selectedVehicle.speed} km/h</span>
              </div>
              <div className="p-3 border border-border rounded bg-muted/10">
                <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> Fuel Level</span>
                <span className="text-sm font-extrabold mt-1 block">{selectedVehicle.fuelLevel}%</span>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Projected ETA</span>
                <span className="font-semibold text-foreground">1h 45m</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Engine Telemetry</span>
                <span className="font-semibold text-green-500">Active (Ok)</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5" /> Coordinates</span>
                <span className="font-mono text-foreground font-semibold">{selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[10px] uppercase tracking-wider">Geofence Status</p>
                <p className="text-[10px] mt-0.5">Asset is within normal operational area borders.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Choose a vehicle to inspect live telemetry.
          </div>
        )}
      </div>

    </div>
  );
};
