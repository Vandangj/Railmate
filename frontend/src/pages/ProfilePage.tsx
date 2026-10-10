import React, { useState } from 'react';
import { User as UserIcon, Shield, Bell, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [defaultClass, setDefaultClass] = useState(user?.preferences?.default_class || '3A');
  const [berthPreference, setBerthPreference] = useState(user?.preferences?.berth_preference || 'Lower');
  const [emailAlerts, setEmailAlerts] = useState(user?.preferences?.email_alerts ?? true);
  const [journeyReminders, setJourneyReminders] = useState(user?.preferences?.journey_reminders ?? true);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.updateProfile({
        full_name: fullName,
        phone,
        preferences: {
          default_class: defaultClass,
          berth_preference: berthPreference,
          email_alerts: emailAlerts,
          journey_reminders: journeyReminders,
        },
      });
      await refreshUser();
      setStatusMsg({ type: 'success', text: 'Profile and preferences updated successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <UserIcon className="w-6 h-6 text-railway-teal" />
          User Profile & Travel Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details and custom passenger booking defaults
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-railway-teal" />
            Account Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy/50 border border-railway-border text-slate-400 text-xs cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Account Role</label>
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy/50 border border-railway-border text-slate-400 text-xs uppercase font-mono">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Booking & Notification Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Default Travel Class</label>
              <select
                value={defaultClass}
                onChange={(e) => setDefaultClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
              >
                <option value="1A">AC First Class (1A)</option>
                <option value="2A">AC 2 Tier (2A)</option>
                <option value="3A">AC 3 Tier (3A)</option>
                <option value="CC">AC Chair Car (CC)</option>
                <option value="SL">Sleeper Class (SL)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Berth Preference</label>
              <select
                value={berthPreference}
                onChange={(e) => setBerthPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
              >
                <option value="Lower">Lower Berth</option>
                <option value="Middle">Middle Berth</option>
                <option value="Upper">Upper Berth</option>
                <option value="Side Lower">Side Lower</option>
                <option value="Side Upper">Side Upper</option>
                <option value="Window">Window Seat</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-railway-border/60">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-railway-border bg-railway-navy text-railway-teal focus:ring-railway-teal"
              />
              <span className="text-xs text-slate-200">
                Receive in-app notification alerts for itinerary updates and confirmations
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={journeyReminders}
                onChange={(e) => setJourneyReminders(e.target.checked)}
                className="rounded border-railway-border bg-railway-navy text-railway-teal focus:ring-railway-teal"
              />
              <span className="text-xs text-slate-200">
                Receive upcoming journey reminders 24 hours prior to scheduled departure
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Preferences
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
