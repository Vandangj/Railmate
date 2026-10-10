import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Clock, MapPin, IndianRupee, ArrowRight, CheckCircle, XCircle, AlertCircle, Compass } from 'lucide-react';
import { api } from '../api/client';
import { Booking } from '../types';

const MyTripsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await api.getBookings();
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load trip history.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-railway-teal" />
            My Trips & Reservation Records
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your scheduled journeys, simulated ticket status, and cancellation history
          </p>
        </div>

        <Link
          to="/routes"
          className="px-4 py-2 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Compass className="w-3.5 h-3.5" /> Book New Journey
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-railway-border/60 pb-3">
        {(['all', 'CONFIRMED', 'CANCELLED'] as const).map((statusKey) => (
          <button
            key={statusKey}
            type="button"
            onClick={() => setFilter(statusKey)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filter === statusKey
                ? 'bg-railway-teal text-white shadow-sm'
                : 'bg-railway-card text-slate-400 hover:text-white border border-railway-border/60'
            }`}
          >
            {statusKey === 'all' ? 'All Journeys' : statusKey.toLowerCase()}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 font-mono">
          {filteredBookings.length} booking(s)
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trips Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-railway-card border border-railway-border animate-pulse space-y-4">
              <div className="h-5 bg-railway-slate rounded w-1/3" />
              <div className="h-10 bg-railway-slate rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-railway-card border border-railway-border rounded-3xl space-y-3">
          <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No journeys in this category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any bookings matching this filter. Search available train timetables to create your first reservation.
          </p>
          <div className="pt-2">
            <Link
              to="/routes"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-railway-teal text-white text-xs font-semibold"
            >
              Search Timetables <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-2xl bg-railway-card border border-railway-border hover:border-railway-teal/60 transition-all shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-railway-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-railway-navy text-railway-teal border border-railway-border">
                    {b.booking_ref}
                  </span>
                  <span className="text-xs text-slate-400">
                    Booked on {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {b.status === 'CONFIRMED' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {b.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-railway-navy text-slate-400 uppercase font-mono">
                    {b.provider_mode}
                  </span>
                </div>
              </div>

              {/* Journey Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <span className="text-xl font-bold text-white">{b.departure_time}</span>
                  <p className="text-sm font-semibold text-slate-200">{b.origin}</p>
                </div>

                <div className="sm:col-span-2 text-center space-y-1">
                  <div className="text-xs text-slate-400 font-medium">
                    {b.train_name} ({b.train_number})
                  </div>
                  <div className="text-xs text-amber-400 font-semibold flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date: {b.travel_date}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-bold text-white">{b.arrival_time}</span>
                  <p className="text-sm font-semibold text-slate-200">{b.destination}</p>
                </div>
              </div>

              {/* Footer Row */}
              <div className="flex items-center justify-between pt-3 border-t border-railway-border/60">
                <div className="text-xs text-slate-400">
                  Passengers:{' '}
                  <strong className="text-slate-200">
                    {b.passengers ? b.passengers.length : 1} Traveler(s)
                  </strong>{' '}
                  • Fare:{' '}
                  <strong className="text-emerald-400 font-bold">₹{b.fare_inr}</strong>
                </div>

                <Link
                  to={`/trips/${b.id}`}
                  className="px-4 py-1.5 rounded-xl bg-railway-slate hover:bg-railway-border text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  Manage & Ticket Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTripsPage;
