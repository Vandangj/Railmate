import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Ticket, ArrowLeft, Calendar, Clock, MapPin, IndianRupee, AlertTriangle, CheckCircle, XCircle, RotateCcw, ShieldCheck, Compass, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { Booking, RouteItinerary } from '../types';
import Modal from '../components/Modal';

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [alternatives, setAlternatives] = useState<RouteItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule / travel plan');
  const [cancelling, setCancelling] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getBooking(Number(id));
      setBooking(data);

      if (data.status === 'CANCELLED') {
        const altData = await api.getAlternatives(Number(id));
        setAlternatives(altData.alternatives || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const updated = await api.cancelBooking(booking.id, cancelReason, true);
      setBooking(updated);
      setIsCancelModalOpen(false);

      // Fetch alternatives after cancellation
      const altData = await api.getAlternatives(booking.id);
      setAlternatives(altData.alternatives || []);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-railway-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Booking Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'This booking may not exist or does not belong to your account.'}</p>
          <Link
            to="/trips"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-railway-teal text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Back button and Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/trips')}
          className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Trips
        </button>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-railway-card text-railway-teal border border-railway-border">
          {booking.booking_ref}
        </span>
      </div>

      {/* Main Ticket Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-railway-card to-railway-navy border border-railway-border shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-railway-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{booking.train_name}</h1>
              <span className="text-xs bg-railway-slate px-2 py-0.5 rounded text-sky-300 font-mono">
                {booking.train_number}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Travel Date: <strong className="text-amber-400">{booking.travel_date}</strong> • {booking.transfers === 0 ? 'Direct Route' : `${booking.transfers} Transfer`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
                booking.status === 'CONFIRMED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {booking.status === 'CONFIRMED' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {booking.status}
            </span>
          </div>
        </div>

        {/* Departure & Arrival */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{booking.departure_time}</span>
            <p className="text-sm font-semibold text-slate-200">{booking.origin}</p>
          </div>
          <div className="text-center text-xs text-slate-400 space-y-1">
            <Clock className="w-4 h-4 mx-auto text-railway-teal" />
            <span>{Math.floor(booking.duration_minutes / 60)}h {booking.duration_minutes % 60}m</span>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{booking.arrival_time}</span>
            <p className="text-sm font-semibold text-slate-200">{booking.destination}</p>
          </div>
        </div>

        {/* Passenger Roster */}
        <div className="pt-4 border-t border-railway-border/60 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Passengers ({booking.passengers ? booking.passengers.length : 1})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {booking.passengers?.map((pax, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-railway-navy border border-railway-border/60 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-white block">{pax.name}</span>
                  <span className="text-[11px] text-slate-400">
                    Age: {pax.age} • {pax.gender}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {pax.seat_number && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-railway-teal/20 text-sky-300 border border-railway-teal/40 font-mono font-bold">
                      Seat: {pax.seat_number}
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded bg-railway-card text-railway-teal border border-railway-border font-medium">
                    {pax.berth_preference || 'Confirmed Seat'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Fare & Management Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-railway-border/60">
          <div>
            <span className="text-xs text-slate-400">Total Booking Fare</span>
            <div className="text-2xl font-extrabold text-emerald-400">₹{booking.fare_inr}</div>
          </div>

          {booking.status === 'CONFIRMED' && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cancel Reservation & Refund
            </button>
          )}
        </div>
      </div>

      {/* Booking Status History Timeline */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-railway-teal" />
          Status History & Audit Trail
        </h3>

        <div className="space-y-4 pl-2 border-l-2 border-railway-slate ml-2 text-xs">
          {booking.status_history?.map((hist, idx) => (
            <div key={idx} className="relative pl-4 space-y-1">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-railway-teal border-2 border-railway-card" />
              <div className="flex items-center gap-2">
                <strong className="text-white">{hist.status}</strong>
                <span className="text-[10px] text-slate-500">{new Date(hist.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{hist.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Itineraries Recommendation if Cancelled */}
      {booking.status === 'CANCELLED' && alternatives.length > 0 && (
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              Suggested Alternative Routes for {booking.origin} → {booking.destination}
            </h3>
            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Disruption Solver
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-railway-navy border border-railway-border hover:border-railway-teal/60 transition-all text-xs space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{alt.train_name}</span>
                  <span className="font-mono text-[10px] text-railway-teal">{alt.train_number}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{alt.departure_time}</span>
                  <span className="text-slate-500">→</span>
                  <span>{alt.arrival_time}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-railway-border/60">
                  <span className="font-bold text-emerald-400">₹{alt.fare_inr}</span>
                  <Link
                    to={`/routes?origin=${encodeURIComponent(alt.origin)}&destination=${encodeURIComponent(alt.destination)}&date=${alt.travel_date}`}
                    className="text-railway-teal hover:underline flex items-center gap-1 text-[11px] font-medium"
                  >
                    View Schedule <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelBooking}
        title="Confirm Journey Cancellation"
        confirmText="Cancel Reservation"
        confirmVariant="danger"
        isLoading={cancelling}
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p>
            Are you sure you wish to cancel booking <strong>{booking.booking_ref}</strong> ({booking.train_name})?
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400">Reason for Cancellation</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-rose-400"
            >
              <option value="Change of schedule / travel plan">Change of schedule / travel plan</option>
              <option value="Booked another train or route">Booked another train or route</option>
              <option value="Personal emergency">Personal emergency</option>
              <option value="Test demo cancellation workflow">Test demo cancellation workflow</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
            <strong>Simulated Refund Calculation:</strong>
            <p>
              Under standard railway rules, an 85% simulated refund (₹{(booking.fare_inr * 0.85).toFixed(2)}) will be credited back to your demo wallet after standard clerkage fees.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetailsPage;
