import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName, phone });
      navigate('/assistant');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-railway-card border border-railway-border rounded-3xl shadow-2xl">
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-railway-teal flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-500/20">
          <Train className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create RailMate Account</h1>
        <p className="text-xs text-slate-400">Save trip preferences and test multi-agent bookings</p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@example.com"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Mobile Phone (Optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full px-4 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-sm focus:outline-none focus:border-railway-teal"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
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
            <UserPlus className="w-4 h-4" />
          )}
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-railway-teal hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
