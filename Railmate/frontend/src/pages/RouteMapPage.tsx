import React, { useState, useEffect } from 'react';
import { Map, MapPin, Compass, Train, Search, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { Station } from '../types';
import LeafletMap from '../components/LeafletMap';

const RouteMapPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await api.getStations();
        setStations(data);
        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
      } catch (e) {
        console.error('Failed to load stations for map:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Map className="w-6 h-6 text-railway-teal" />
            Interactive Railway Network Map
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing Indian Railway junctions, connecting corridors, and topological graph vertices
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-railway-navy px-3.5 py-1.5 rounded-xl border border-railway-border font-medium">
          OpenStreetMap Tiles & Leaflet
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stations Sidebar */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4 flex flex-col h-[600px]">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-railway-teal" />
              Railway Stations ({stations.length})
            </h2>
            <p className="text-xs text-slate-400">Click a station to inspect its location & code</p>
          </div>

          {/* Search filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search station or city..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-railway-border/30">
            {filteredStations.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStation(st)}
                className={`w-full text-left p-3 rounded-xl transition-all pt-2.5 ${
                  selectedStation?.id === st.id
                    ? 'bg-railway-slate text-white border border-railway-teal/60'
                    : 'hover:bg-railway-navy/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">{st.name}</span>
                  <span className="text-[10px] font-mono bg-railway-navy px-1.5 py-0.5 rounded text-railway-teal font-bold">
                    {st.code}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>City: {st.city}</span>
                  <span>Lat: {st.latitude?.toFixed(2)}, Lon: {st.longitude?.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Station Details Preview */}
          {selectedStation && (
            <div className="p-3.5 rounded-xl bg-railway-navy border border-railway-border text-xs space-y-1.5 shrink-0">
              <span className="font-bold text-slate-200 block">{selectedStation.name}</span>
              <p className="text-slate-400 text-[11px]">Station Code: {selectedStation.code} • City: {selectedStation.city}</p>
              <div className="pt-2">
                <a
                  href={`/routes?origin=${encodeURIComponent(selectedStation.city)}&destination=Jaipur&date=2026-12-20`}
                  className="text-railway-teal hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                >
                  Find trains departing from {selectedStation.city} <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Map View */}
        <div className="lg:col-span-2 h-[600px]">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-railway-card rounded-3xl border border-railway-border">
              <div className="w-8 h-8 border-4 border-railway-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <LeafletMap
              stations={stations}
              height="600px"
              onSelectStation={(st) => setSelectedStation(st)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteMapPage;
