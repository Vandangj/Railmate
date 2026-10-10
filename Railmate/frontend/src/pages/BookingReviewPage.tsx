import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Plus, Trash2, ShieldCheck, AlertCircle, ArrowRight, Clock, IndianRupee, Train, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { RouteItinerary, Passenger, BookingPreview } from '../types';
import Modal from '../components/Modal';

const BookingReviewPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const route: RouteItinerary | undefined = location.state?.route;

  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      name: user?.full_name || '',
      age: 28,
      gender: 'Male',
      berth_preference: 'Lower',
    },
  ]);

  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [acknowledgedDemo, setAcknowledgedDemo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no route was passed in state, redirect to routes
  useEffect(() => {
    if (!route) {
      navigate('/routes');
    }
  }, [route, navigate]);

  // Fetch fare preview whenever passenger list changes
  useEffect(() => {
    if (!route) return;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const previewData = await api.getBookingPreview({
          route_id: route.id,
          origin: route.origin,
          destination: route.destination,
          travel_date: route.travel_date,
          train_number: route.train_number,
          train_name: route.train_name,
          departure_time: route.departure_time,
          arrival_time: route.arrival_time,
          duration_minutes: route.duration_minutes,
          transfers: route.transfers,
          base_fare_inr: route.fare_inr,
          passengers,
        });
        setPreview(previewData);
      } catch (err: any) {
        console.error('Failed to calculate preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [passengers, route]);

  if (!route) return null;

  const handleAddPassenger = () => {
    if (passengers.length >= 6) return;
    setPassengers((prev) => [
      ...prev,
      { name: '', age: 25, gender: 'Male', berth_preference: 'No Preference' },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: any) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleInitiateBooking = () => {
    setError(null);
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim()) {
        setError(`Please enter the name for passenger #${i + 1}`);
        return;
      }
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!acknowledgedDemo) {
      setError('Please acknowledge the demo booking notice to continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newBooking = await api.createBooking({
        route_id: route.id,
        origin: route.origin,
        destination: route.destination,
        travel_date: route.travel_date,
        train_number: route.train_number,
        train_name: route.train_name,
        departure_time: route.departure_time,
        arrival_time: route.arrival_time,
        duration_minutes: route.duration_minutes,
        transfers: route.transfers,
        total_fare_inr: preview ? preview.total_fare_inr : route.fare_inr * passengers.length,
        passengers,
        idempotency_key: idempotencyKey,
        confirmed: true,
      });

      setIsConfirmModalOpen(false);
      navigate(`/trips/${newBooking.id}`, { state: { justBooked: true } });
    } catch (err: any) {
      setError(err.message || 'Booking submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Review Itinerary & Passenger Details</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review journey timings, add co-passengers, and simulate confirmed booking
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Itinerary Summary Banner */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-railway-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <Train className="w-5 h-5 text-railway-teal" />
            <h2 className="text-base font-bold text-white">{route.train_name}</h2>
            <span className="text-xs bg-railway-navy px-2 py-0.5 rounded font-mono text-slate-300">
              {route.train_number}
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
            {route.transfers === 0 ? 'Direct Journey' : `${route.transfers} Transfer (${route.connection_at})`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-xl font-bold text-white">{route.departure_time}</span>
            <p className="text-sm font-semibold text-slate-200">{route.origin}</p>
            <p className="text-xs text-slate-400">{route.from_station}</p>
          </div>
          <div className="text-center text-xs text-slate-400 space-y-1">
            <Clock className="w-3.5 h-3.5 mx-auto text-railway-teal" />
            <span>{Math.floor(route.duration_minutes / 60)}h {route.duration_minutes % 60}m</span>
            <p className="text-[11px] text-amber-400">Date: {route.travel_date}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-white">{route.arrival_time}</span>
            <p className="text-sm font-semibold text-slate-200">{route.destination}</p>
            <p className="text-xs text-slate-400">{route.to_station}</p>
          </div>
        </div>
      </div>

      {/* Passenger Details Form */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-railway-teal" />
            Passenger Information ({passengers.length})
          </h3>
          {passengers.length < 6 && (
            <button
              type="button"
              onClick={handleAddPassenger}
              className="text-xs font-semibold text-railway-teal hover:text-sky-300 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Passenger
            </button>
          )}
        </div>

        <div className="space-y-4">
          {passengers.map((pax, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-railway-navy border border-railway-border/80 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Passenger #{idx + 1}</span>
                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={pax.name}
                    onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                    placeholder="As per Government ID"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={pax.age}
                    onChange={(e) => handlePassengerChange(idx, 'age', Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Gender</label>
                  <select
                    value={pax.gender}
                    onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fare Summary Breakdown */}
      {preview && (
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            Fare Breakdown & Charges
          </h3>

          <div className="space-y-2 text-xs text-slate-300 divide-y divide-railway-border/40">
            <div className="flex items-center justify-between pt-1">
              <span>Base Fare (₹{preview.base_fare_per_passenger} × {preview.passenger_count})</span>
              <span>₹{(preview.base_fare_per_passenger * preview.passenger_count).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span>Railway GST (5%)</span>
              <span>₹{preview.gst_inr.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span>Convenience Service Fee</span>
              <span>₹{preview.service_charge_inr.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 text-base font-extrabold text-emerald-400">
              <span>Total Payable</span>
              <span>₹{preview.total_fare_inr.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-railway-navy border border-railway-border/60 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-railway-teal shrink-0" />
            <span>{preview.notice}</span>
          </div>

          <button
            type="button"
            onClick={handleInitiateBooking}
            className="w-full py-3.5 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
          >
            Confirm & Reserve Demo Ticket <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Explicit Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmBooking}
        title="Confirm Railway Reservation"
        confirmText="Confirm Reservation"
        isLoading={submitting}
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-railway-navy border border-railway-border space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Journey:</span>
              <strong className="text-white">{route.origin} → {route.destination}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Train:</span>
              <span className="text-slate-200">{route.train_name} ({route.train_number})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Travel Date:</span>
              <span className="text-slate-200">{route.travel_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Passengers:</span>
              <span className="text-slate-200">{passengers.length} Traveler(s)</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold text-sm pt-2 border-t border-railway-border/60">
              <span>Total Amount:</span>
              <span>₹{preview?.total_fare_inr}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
            <strong>Mandatory Demo Disclaimer:</strong>
            <p>
              This is an academic evaluation project. The confirmation will create a distinct internal Demo record (DEMO-RM-XXXXXX). No genuine railway seat is held, and no payment card will be billed.
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={acknowledgedDemo}
              onChange={(e) => setAcknowledgedDemo(e.target.checked)}
              className="mt-0.5 rounded border-railway-border bg-railway-navy text-railway-teal focus:ring-railway-teal"
            />
            <span className="text-slate-200 select-none">
              I acknowledge that this is a simulated demo reservation and grant explicit confirmation to proceed.
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default BookingReviewPage;
