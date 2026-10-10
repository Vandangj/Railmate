import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Train, LogIn, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@railmate.com');
      setPassword('admin123');
    } else {
      setEmail('demo@railmate.com');
      setPassword('demo123');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-railway-card border border-railway-border rounded-3xl shadow-2xl">
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-railway-teal flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-500/20">
          <Train className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to RailMate</h1>
        <p className="text-xs text-slate-400">Access your saved trips, bookings, and conversational assistant</p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          Sign In
        </button>
      </form>

      {/* Demo Credentials Quick Fill */}
      <div className="mt-8 pt-6 border-t border-railway-border/60 space-y-3">
        <span className="text-[11px] font-semibold text-slate-400 block text-center uppercase tracking-wider">
          Quick Demo Credentials
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('user')}
            className="p-2 rounded-xl bg-railway-slate/40 hover:bg-railway-slate text-xs text-slate-300 border border-railway-border/60 transition-colors flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-railway-teal" />
            Traveler Account
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-xs text-purple-300 border border-purple-800/40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Admin Account
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-railway-teal hover:underline font-medium">
          Create one now
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
