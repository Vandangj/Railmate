import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Station, RouteItinerary } from '../types';

interface LeafletMapProps {
  stations: Station[];
  activeRoute?: RouteItinerary | null;
  onSelectStation?: (station: Station) => void;
  height?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  stations,
  activeRoute,
  onSelectStation,
  height = '500px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Central India [22.5, 78.5], zoom 5
      const map = L.map(mapContainerRef.current).setView([22.5, 78.5], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // Custom Station Circle Markers
    const stationCoordinates: Record<string, [number, number]> = {};

    stations.forEach((st) => {
      if (st.latitude && st.longitude) {
        stationCoordinates[st.city.toLowerCase()] = [st.latitude, st.longitude];
        stationCoordinates[st.code.toLowerCase()] = [st.latitude, st.longitude];

        const isTerminal =
          activeRoute &&
          (activeRoute.origin.toLowerCase() === st.city.toLowerCase() ||
            activeRoute.destination.toLowerCase() === st.city.toLowerCase());

        const marker = L.circleMarker([st.latitude, st.longitude], {
          radius: isTerminal ? 8 : 5,
          color: isTerminal ? '#0EA5E9' : '#1E3E62',
          fillColor: isTerminal ? '#38BDF8' : '#0EA5E9',
          fillOpacity: 0.9,
          weight: 2,
        });

        marker.bindPopup(`
          <div style="font-family: inherit; color: #0f172a; padding: 4px;">
            <strong style="font-size: 14px;">${st.name} (${st.code})</strong>
            <p style="margin: 2px 0 0 0; color: #475569; font-size: 12px;">City: ${st.city}</p>
          </div>
        `);

        if (onSelectStation) {
          marker.on('click', () => onSelectStation(st));
        }

        layerGroupRef.current?.addLayer(marker);
      }
    });

    // Draw lines between network stations
    // Standard network segments
    const standardCorridors = [
      ['mumbai', 'ahmedabad'],
      ['ahmedabad', 'jaipur'],
      ['mumbai', 'jaipur'],
      ['mumbai', 'pune'],
      ['ahmedabad', 'vadodara'],
      ['delhi', 'mumbai'],
      ['delhi', 'jaipur'],
      ['delhi', 'agra'],
      ['delhi', 'kota'],
      ['kota', 'mumbai'],
      ['agra', 'kanpur'],
      ['kanpur', 'varanasi'],
      ['varanasi', 'kolkata'],
      ['delhi', 'varanasi'],
      ['delhi', 'kolkata'],
      ['mumbai', 'goa'],
      ['goa', 'bengaluru'],
      ['mumbai', 'bengaluru'],
      ['bengaluru', 'chennai'],
      ['chennai', 'kolkata'],
      ['pune', 'bengaluru'],
    ];

    standardCorridors.forEach(([c1, c2]) => {
      const p1 = stationCoordinates[c1];
      const p2 = stationCoordinates[c2];
      if (p1 && p2) {
        const polyline = L.polyline([p1, p2], {
          color: '#1E3E62',
          weight: 2,
          opacity: 0.5,
          dashArray: '4, 6',
        });
        layerGroupRef.current?.addLayer(polyline);
      }
    });

    // If an active route is selected, highlight its path!
    if (activeRoute && activeRoute.legs) {
      const routePoints: [number, number][] = [];
      activeRoute.legs.forEach((leg) => {
        const pFrom = stationCoordinates[leg.from_city.toLowerCase()];
        const pTo = stationCoordinates[leg.to_city.toLowerCase()];
        if (pFrom && (!routePoints.length || routePoints[routePoints.length - 1] !== pFrom)) {
          routePoints.push(pFrom);
        }
        if (pTo) {
          routePoints.push(pTo);
        }
      });

      if (routePoints.length >= 2) {
        const activePolyline = L.polyline(routePoints, {
          color: '#0EA5E9',
          weight: 4,
          opacity: 0.9,
        });
        layerGroupRef.current?.addLayer(activePolyline);

        mapInstanceRef.current.fitBounds(activePolyline.getBounds(), {
          padding: [50, 50],
          maxZoom: 7,
        });
      }
    }
  }, [stations, activeRoute, onSelectStation]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-railway-border/80 shadow-xl" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 bg-railway-dark/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-railway-border text-[11px] text-slate-300 z-[1000] flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Terminal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Demo Junction
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-sky-400 inline-block" /> Active Itinerary
        </span>
      </div>
    </div>
  );
};

export default LeafletMap;
