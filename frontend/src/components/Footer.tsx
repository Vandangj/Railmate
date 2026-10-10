import React from 'react';
import { Link } from 'react-router-dom';
import { Train, ShieldAlert, Cpu, Network, Database } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-railway-navy border-t border-railway-border/60 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Project Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-railway-teal flex items-center justify-center text-white font-bold">
                <Train className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">RailMate</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An AI-Powered Multi-Agent Railway Travel Assistant using NetworkX graph route planning, Google Gemini NLU, and transparent booking simulation.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] bg-railway-slate text-railway-teal px-2 py-0.5 rounded font-mono">FastAPI</span>
              <span className="text-[10px] bg-railway-slate text-railway-teal px-2 py-0.5 rounded font-mono">React TS</span>
              <span className="text-[10px] bg-railway-slate text-railway-teal px-2 py-0.5 rounded font-mono">MySQL 8</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/routes" className="hover:text-railway-teal transition-colors">Find Route Itineraries</Link></li>
              <li><Link to="/assistant" className="hover:text-railway-teal transition-colors">Conversational AI Chat</Link></li>
              <li><Link to="/map" className="hover:text-railway-teal transition-colors">Interactive Network Map</Link></li>
              <li><Link to="/trips" className="hover:text-railway-teal transition-colors">Trip History & Bookings</Link></li>
            </ul>
          </div>

          {/* Multi-Agent Architecture */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Multi-Agent Core</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-railway-teal" /> NLU Intent Agent</li>
              <li className="flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-railway-teal" /> Route Planning Agent</li>
              <li className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-railway-teal" /> Booking & Confirmation Agent</li>
              <li className="flex items-center gap-1.5"><Train className="w-3.5 h-3.5 text-railway-teal" /> Reservation Management Agent</li>
            </ul>
          </div>

          {/* Mandatory Demo Disclaimer Notice */}
          <div className="bg-railway-card/80 p-4 rounded-xl border border-railway-border/60 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <ShieldAlert className="w-4 h-4" />
              Academic Demo Notice
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Timetable schedules, fares, and train routes are curated demo records for educational evaluation. Actions do not issue real IRCTC tickets, real PNRs, or financial transactions.
            </p>
          </div>
        </div>

        <div className="border-t border-railway-border/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RailMate. College Project Demonstration.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <Link to="/support" className="hover:text-slate-300">Support & FAQs</Link>
            <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-railway-teal">FastAPI Swagger Docs</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
