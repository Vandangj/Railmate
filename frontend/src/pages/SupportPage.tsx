import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, CheckCircle, AlertCircle, LifeBuoy, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { api } from '../api/client';

const SupportPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await api.getSupportTickets();
      setTickets(data);
    } catch (e) {
      // Ignore if user unauthenticated
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      await api.createSupportTicket({
        subject,
        booking_ref: bookingRef || undefined,
        description,
      });
      setStatusMsg({ type: 'success', text: 'Support ticket submitted successfully. Our team will review it.' });
      setSubject('');
      setBookingRef('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit support ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'Does RailMate make real IRCTC train reservations or charge credit cards?',
      a: 'No. RailMate is an academic software project. All bookings are simulated demo reservations marked with DEMO-RM-XXXXXX references. No financial transactions take place, and no real railway seats are held.',
    },
    {
      q: 'How does the multi-hop route planner work?',
      a: 'RailMate utilizes NetworkX to model stations as graph vertices and train schedule timetables as directed multigraph edges. It searches for direct paths as well as connecting itineraries having 1 or 2 transfers, enforcing realistic transfer layovers between 45 and 720 minutes while preventing cyclical routes.',
    },
    {
      q: 'What happens if Google Gemini API key is not configured or exceeds quota?',
      a: 'RailMate features an integrated Deterministic Fallback NLU provider. If the Gemini API key is missing or encounters a rate limit, the system automatically falls back to rule-based pattern matching and continues answering user travel requests seamlessly.',
    },
    {
      q: 'How do simulated cancellations and refunds work?',
      a: 'When you cancel a confirmed demo booking, the Reservation Management Agent computes simulated cancellation clerkage charges (15%) and refunds 85% back to your demo account balance, logging the event in the system audit trail.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <LifeBuoy className="w-6 h-6 text-railway-teal" />
          Help Desk & Support Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Assistance with itinerary planning, demo booking queries, and technical documentation
        </p>
      </div>

      {/* Frequently Asked Questions */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-railway-teal" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl bg-railway-navy border border-railway-border/60 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left text-xs font-semibold text-slate-200 flex items-center justify-between hover:bg-railway-slate/30 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-railway-teal" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-railway-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Ticket Form */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" />
          Submit an Inquiry or Report Booking Issue
        </h2>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Query regarding multi-hop layover in Jaipur"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Booking Ref (Optional)</label>
              <input
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                placeholder="e.g. DEMO-RM-7A2B9C"
                className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Detailed Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue or feedback in detail..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-railway-navy border border-railway-border text-white text-xs focus:outline-none focus:border-railway-teal"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-railway-teal hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Ticket
          </button>
        </form>
      </div>

      {/* User's Submitted Tickets */}
      {tickets.length > 0 && (
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Your Support Tickets ({tickets.length})
          </h2>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-railway-navy border border-railway-border/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">{t.subject}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {t.status}
                  </span>
                </div>
                {t.booking_ref && (
                  <p className="text-[11px] text-slate-400">Ref: {t.booking_ref}</p>
                )}
                <p className="text-slate-300">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
