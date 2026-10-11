import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Compass, MessageSquare, ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, Clock, GitCommit, Layers } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('Mumbai');
  const [destination, setDestination] = useState('Jaipur');
  const [travelDate, setTravelDate] = useState('2026-12-20');
  const [preference, setPreference] = useState('fastest');
  const [maxTransfers, setMaxTransfers] = useState('1');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !travelDate) return;
    navigate(`/routes?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${travelDate}&pref=${preference}&transfers=${maxTransfers}`);
  };

  const popularRoutes = [
    { from: 'Delhi', to: 'Mumbai', note: 'Golden Quadrilateral Superfast' },
    { from: 'Delhi', to: 'Jaipur', note: 'Fast intercity & Vande Bharat' },
    { from: 'Mumbai', to: 'Jaipur', note: 'Direct & 1-Hop via Ahmedabad' },
    { from: 'Mumbai', to: 'Ahmedabad', note: 'High frequency express' },
    { from: 'Delhi', to: 'Varanasi', note: 'Heritage route via Kanpur' },
    { from: 'Bengaluru', to: 'Chennai', note: 'Southern Shatabdi corridor' },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 border border-railway-border/80 bg-gradient-to-br from-railway-navy via-railway-card to-railway-dark shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-railway-teal/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-railway-slate/60 border border-railway-teal/30 text-railway-teal text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Multi-Agent Railway System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Plan Smarter Railway Journeys with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Intelligent Multi-Hop Routing</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Ask in natural language or search conventional timetables. RailMate coordinates five specialized AI agents to compute deterministic multi-hop connections, transfer layovers, and transparent demo bookings.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/assistant"
              className="px-6 py-3 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all group"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Travel Assistant
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/map"
              className="px-6 py-3 rounded-xl bg-railway-card hover:bg-railway-slate text-slate-200 font-semibold text-sm border border-railway-border transition-colors flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore Network Map
            </Link>
          </div>
        </div>

        {/* Search Card */}
        <div className="mt-12 bg-railway-navy/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-railway-border shadow-xl">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-railway-teal" />
            Quick Timetable Search
          </h2>

          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-railway-teal" /> From City
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Mumbai"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-card border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> To City
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Jaipur"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-card border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Travel Date
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-card border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Preference
              </label>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-card border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal transition-colors"
              >
                <option value="fastest">Fastest Duration</option>
                <option value="cheapest">Cheapest Fare</option>
                <option value="fewest">Fewest Transfers</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Find Itineraries
              </button>
            </div>
          </form>

          {/* Quick Route Pills */}
          <div className="mt-4 pt-4 border-t border-railway-border/60 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Popular Corridors:</span>
            {popularRoutes.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setOrigin(r.from);
                  setDestination(r.to);
                }}
                className="text-xs bg-railway-card hover:bg-railway-slate text-slate-300 px-2.5 py-1 rounded-lg border border-railway-border/60 transition-colors"
              >
                {r.from} → {r.to}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Academic & Technical Excellence</h2>
          <p className="text-sm text-slate-400">
            A cohesive architecture combining Python FastAPI micro-services, deterministic graph algorithms, and multi-agent coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-railway-card border border-railway-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-railway-teal flex items-center justify-center font-bold">
              <GitCommit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">NetworkX Graph Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Models stations as graph vertices and timetable schedules as directed edges. Enforces layovers between 45 and 720 minutes, cycle prevention, and multi-hop itinerary synthesis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-railway-card border border-railway-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">5-Agent Orchestration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decoupled agents for Natural Language Understanding, Route Planning, Booking Preview, Reservation Management, and Notification alerts under a central Orchestrator.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-railway-card border border-railway-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Transparent Demo Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero fabricated live PNR or fake IRCTC claims. Clear demo references, idempotent state machines, simulated refunds, and live audit logging for evaluation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
