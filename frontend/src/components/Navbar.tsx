import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Train, MessageSquare, Map, Ticket, Shield, User, LogOut, Bell, Menu, X, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-railway-navy/90 backdrop-blur-md border-b border-railway-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-railway-teal to-blue-600 flex items-center justify-center shadow-lg shadow-railway-teal/20 group-hover:scale-105 transition-transform">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Rail<span className="text-railway-teal">Mate</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-railway-slate text-railway-teal font-medium uppercase tracking-wider">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">Multi-Agent Railway Assistant</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/routes"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/routes') ? 'bg-railway-slate text-railway-teal' : 'text-slate-300 hover:text-white hover:bg-railway-card'
              }`}
            >
              <Compass className="w-4 h-4" />
              Find Routes
            </Link>

            <Link
              to="/assistant"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/assistant') ? 'bg-railway-slate text-railway-teal' : 'text-slate-300 hover:text-white hover:bg-railway-card'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </Link>

            <Link
              to="/map"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/map') ? 'bg-railway-slate text-railway-teal' : 'text-slate-300 hover:text-white hover:bg-railway-card'
              }`}
            >
              <Map className="w-4 h-4" />
              Network Map
            </Link>

            {user && (
              <Link
                to="/trips"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/trips') ? 'bg-railway-slate text-railway-teal' : 'text-slate-300 hover:text-white hover:bg-railway-card'
                }`}
              >
                <Ticket className="w-4 h-4" />
                My Trips
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/admin') ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Right actions: Notifications & User profile */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <NotificationDropdown />

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-railway-card hover:bg-railway-border/40 text-sm border border-railway-border transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-railway-teal/20 text-railway-teal flex items-center justify-center font-bold text-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="text-slate-200 font-medium truncate max-w-[120px]">{user.full_name}</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium bg-railway-teal hover:bg-sky-400 text-white rounded-lg shadow-md shadow-sky-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-railway-card focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-railway-navy border-b border-railway-border px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/routes"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-railway-slate"
          >
            Find Routes
          </Link>
          <Link
            to="/assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-railway-slate"
          >
            AI Assistant
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-railway-slate"
          >
            Network Map
          </Link>
          {user && (
            <>
              <Link
                to="/trips"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-railway-slate"
              >
                My Trips
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-railway-slate"
              >
                Profile & Preferences
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-400 hover:bg-purple-950/30"
            >
              Admin Dashboard
            </Link>
          )}
          <Link
            to="/support"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-railway-slate"
          >
            Support & Help
          </Link>

          <div className="pt-3 border-t border-railway-border/60">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out ({user.full_name})
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-200 bg-railway-card"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full px-3 py-2 rounded-lg text-sm font-medium bg-railway-teal text-white"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
