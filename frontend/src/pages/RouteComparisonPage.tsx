import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, Compass, Clock, IndianRupee, GitFork, ArrowRight, ShieldAlert, ArrowRightLeft, MapPin, Calendar, Filter, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { RouteItinerary, RouteSearchResponse } from '../types';

const RouteComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [origin, setOrigin] = useState(searchParams.get('origin') || 'Mumbai');
  const [destination, setDestination] = useState(searchParams.get('destination') || 'Jaipur');
  const [travelDate, setTravelDate] = useState(searchParams.get('date') || '2026-12-20');
  const [preference, setPreference] = useState(searchParams.get('pref') || 'fastest');
  const [maxTransfers, setMaxTransfers] = useState(Number(searchParams.get('transfers') || 2));

  const [routes, setRoutes] = useState<RouteItinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const executeSearch = async () => {
    if (!origin.trim() || !destination.trim() || !travelDate.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data: RouteSearchResponse = await api.searchRoutes({
        origin,
        destination,
        travel_date: travelDate,
        preference,
        max_transfers: maxTransfers,
      });
      setRoutes(data.routes || []);
      setMessage(data.message || '');
    } catch (err: any) {
      setError(err.message || 'Route search failed.');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [preference, searchParams]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      origin,
      destination,
      date: travelDate,
      pref: preference,
      transfers: String(maxTransfers),
    });
    executeSearch();
  };

  const handleBook = (route: RouteItinerary) => {
    navigate('/booking/review', { state: { route } });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Search Header Bar */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-railway-teal" /> Origin
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Mumbai"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Jaipur"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Date
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-purple-400" /> Max Transfers
            </label>
            <select
              value={maxTransfers}
              onChange={(e) => setMaxTransfers(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
            >
              <option value={0}>Direct Only (0 Transfers)</option>
              <option value={1}>Up to 1 Transfer</option>
              <option value={2}>Up to 2 Transfers</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search Routes
            </button>
          </div>
        </form>

        {/* Quick Route Presets */}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Popular Corridors:</span>
          {[
            { from: 'Delhi', to: 'Mumbai' },
            { from: 'Delhi', to: 'Jaipur' },
            { from: 'Mumbai', to: 'Ahmedabad' },
            { from: 'Mumbai', to: 'Jaipur' },
            { from: 'Delhi', to: 'Varanasi' },
            { from: 'Bengaluru', to: 'Chennai' },
            { from: 'Mumbai', to: 'Goa' },
            { from: 'Mumbai', to: 'Pune' },
          ].map((pair) => (
            <button
              key={`${pair.from}-${pair.to}`}
              type="button"
              onClick={() => {
                setOrigin(pair.from);
                setDestination(pair.to);
                setSearchParams({
                  origin: pair.from,
                  destination: pair.to,
                  date: travelDate,
                  pref: preference,
                  transfers: String(maxTransfers),
                });
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-railway-navy border border-railway-border/60 text-slate-300 hover:text-railway-teal hover:border-railway-teal/50 transition-all font-medium"
            >
              {pair.from} → {pair.to}
            </button>
          ))}
        </div>

        {/* Filter Ranking Tabs */}
        <div className="flex items-center justify-between pt-3 border-t border-railway-border/60 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Rank by:</span>
            {(['fastest', 'cheapest', 'fewest'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreference(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  preference === p
                    ? 'bg-railway-teal text-white shadow-sm'
                    : 'bg-railway-navy text-slate-400 hover:text-white border border-railway-border/60'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Link
            to="/map"
            className="text-xs text-railway-teal hover:underline flex items-center gap-1 font-medium"
          >
            <Compass className="w-3.5 h-3.5" /> View Network Topology on Map
          </Link>
        </div>
      </div>

      {/* Results Header / Message */}
      {message && (
        <div className="p-4 rounded-2xl bg-railway-card border border-railway-border/80 text-xs text-slate-300 flex items-center justify-between">
          <span>{message}</span>
          <span className="text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            DEMO SCHEDULES
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Route Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-railway-card border border-railway-border animate-pulse space-y-4">
              <div className="h-5 bg-railway-slate rounded w-1/4" />
              <div className="h-10 bg-railway-slate rounded w-3/4" />
              <div className="h-8 bg-railway-slate rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-16 bg-railway-card border border-railway-border rounded-3xl space-y-3">
          <Compass className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No scheduled routes found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or test known corridors like Mumbai to Jaipur, Mumbai to Ahmedabad, or Delhi to Varanasi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route, idx) => (
            <div
              key={route.id}
              className="p-6 rounded-2xl bg-railway-card border border-railway-border hover:border-railway-teal/60 transition-all shadow-xl space-y-5"
            >
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-railway-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-railway-teal/10 text-railway-teal flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{route.train_name}</h3>
                    <p className="text-xs text-slate-400">Train ID: {route.train_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      route.transfers === 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {route.transfers === 0 ? 'Direct Route' : `${route.transfers} Transfer (${route.connection_at})`}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-railway-navy text-slate-400 font-mono">
                    {route.source}
                  </span>
                </div>
              </div>

              {/* Journey Timeline Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                {/* Departure */}
                <div>
                  <span className="text-2xl font-extrabold text-white">{route.departure_time}</span>
                  <p className="text-sm font-semibold text-slate-300">{route.origin}</p>
                  <p className="text-[11px] text-slate-400">{route.from_station}</p>
                </div>

                {/* Duration & Transfers */}
                <div className="sm:col-span-2 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-railway-teal" />
                    <span>
                      {Math.floor(route.duration_minutes / 60)}h {route.duration_minutes % 60}m Total
                    </span>
                  </div>

                  {/* Graphical visual line */}
                  <div className="relative flex items-center justify-center w-full">
                    <div className="h-0.5 bg-railway-slate w-full" />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-railway-teal left-0" />
                    {route.transfers > 0 && (
                      <div
                        className="absolute w-3 h-3 rounded-full bg-amber-400 border-2 border-railway-card"
                        title={`Transfer at ${route.connection_at} (Wait: ${route.connection_wait_minutes} mins)`}
                      />
                    )}
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 right-0" />
                  </div>

                  {route.transfers > 0 && (
                    <p className="text-[11px] text-amber-300 font-medium">
                      Layover: {Math.floor((route.connection_wait_minutes || 0) / 60)}h {(route.connection_wait_minutes || 0) % 60}m at {route.connection_at}
                    </p>
                  )}
                </div>

                {/* Arrival */}
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-white">{route.arrival_time}</span>
                  <p className="text-sm font-semibold text-slate-300">{route.destination}</p>
                  <p className="text-[11px] text-slate-400">{route.to_station}</p>
                </div>
              </div>

              {/* Legs Breakdown If Multi-Hop */}
              {route.legs && route.legs.length > 1 && (
                <div className="p-3.5 rounded-xl bg-railway-navy/70 border border-railway-border/60 text-xs space-y-2">
                  <span className="font-semibold text-slate-300 block">Itinerary Segments:</span>
                  <div className="space-y-1.5 divide-y divide-railway-border/30">
                    {route.legs.map((leg, lIdx) => (
                      <div key={lIdx} className="pt-1.5 flex items-center justify-between text-slate-400">
                        <span>
                          Leg {lIdx + 1}: <strong className="text-slate-200">{leg.train_name} ({leg.train_number})</strong>
                        </span>
                        <span>
                          {leg.from_city} ({leg.departure_time}) → {leg.to_city} ({leg.arrival_time})
                        </span>
                        <span className="font-medium text-slate-200">₹{leg.fare_inr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Row: Fare & Book Action */}
              <div className="flex items-center justify-between pt-3 border-t border-railway-border/60">
                <div>
                  <span className="text-xs text-slate-400">Estimated Total Fare</span>
                  <div className="text-2xl font-extrabold text-emerald-400">₹{route.fare_inr}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleBook(route)}
                    className="px-6 py-2.5 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center gap-2"
                  >
                    Select & Review Booking <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteComparisonPage;
