import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User as UserIcon, Sparkles, AlertCircle, ArrowRight, Clock, IndianRupee, GitFork, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api/client';
import { ChatMessageResponse, RouteItinerary, ExtractedEntities } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  extracted?: ExtractedEntities;
  suggested_routes?: RouteItinerary[] | null;
  agent?: string;
  provider?: string;
  notice?: string | null;
  timestamp: string;
}

const TravelAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Namaste! I am RailMate's multi-agent travel assistant. You can speak naturally, for example: 'Find the cheapest route from Mumbai to Jaipur on 20 December, with no more than one change.'",
      agent: 'Central Orchestrator',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const response: ChatMessageResponse = await api.sendChatMessage(textToSend, conversationId);
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        extracted: response.extracted,
        suggested_routes: response.suggested_routes,
        agent: response.agent,
        provider: response.provider,
        notice: response.notice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Apologies, I encountered an issue: ${err.message || 'Please check your connection and try again.'}`,
          agent: 'Error Handler',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Find the cheapest route from Mumbai to Jaipur on 20 December with no more than one change",
    "Show the fastest route from Mumbai to Ahmedabad tomorrow",
    "Find trains from Delhi to Varanasi on 2026-12-20",
    "Show cheaper options instead",
    "Limit transfers to one",
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-railway-card border border-railway-border">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-railway-teal" />
            RailMate Conversational Travel Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Natural language travel queries parsed with Google Gemini & deterministic graph solver
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Multi-Agent Active
          </span>
          <button
            onClick={() => {
              setMessages([messages[0]]);
              setConversationId(undefined);
            }}
            title="Start new conversation"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-railway-slate transition-colors text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 shrink-0 font-medium">Try asking:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-railway-card hover:bg-railway-slate text-slate-300 border border-railway-border/80 transition-colors text-left"
          >
            "{p}"
          </button>
        ))}
      </div>

      {/* Chat Messages Panel */}
      <div className="h-[520px] rounded-2xl bg-railway-navy border border-railway-border p-4 sm:p-6 overflow-y-auto space-y-6 flex flex-col">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-railway-slate text-railway-teal border border-railway-teal/40'
              }`}
            >
              {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-2.5 ${m.sender === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-railway-card border border-railway-border text-slate-200 rounded-tl-none shadow-lg'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Notice if any */}
                {m.notice && (
                  <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.notice}</span>
                  </div>
                )}
              </div>

              {/* Extracted Parameters Tag Pills */}
              {m.extracted && m.extracted.origin && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-500">Extracted:</span>
                  <span className="bg-railway-card px-2 py-0.5 rounded border border-railway-border text-sky-400">
                    From: {m.extracted.origin}
                  </span>
                  {m.extracted.destination && (
                    <span className="bg-railway-card px-2 py-0.5 rounded border border-railway-border text-emerald-400">
                      To: {m.extracted.destination}
                    </span>
                  )}
                  {m.extracted.travel_date && (
                    <span className="bg-railway-card px-2 py-0.5 rounded border border-railway-border text-amber-400">
                      Date: {m.extracted.travel_date}
                    </span>
                  )}
                  <span className="bg-railway-card px-2 py-0.5 rounded border border-railway-border text-purple-400 capitalize">
                    {m.extracted.preference}
                  </span>
                </div>
              )}

              {/* Suggested Itineraries Card in Chat */}
              {m.suggested_routes && m.suggested_routes.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Found {m.suggested_routes.length} matching journey option(s):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {m.suggested_routes.slice(0, 5).map((route) => (
                      <div
                        key={route.id}
                        className="p-3.5 rounded-xl bg-railway-slate/40 border border-railway-border hover:border-railway-teal/60 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{route.train_name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-railway-navy text-railway-teal font-mono">
                            {route.train_number}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <div>
                            <p className="font-semibold text-slate-100">{route.departure_time}</p>
                            <p className="text-[10px] text-slate-400">{route.origin}</p>
                          </div>
                          <div className="text-center text-[10px] text-slate-400">
                            <Clock className="w-3 h-3 inline mx-1 text-slate-400" />
                            {Math.floor(route.duration_minutes / 60)}h {route.duration_minutes % 60}m
                            <div className="text-amber-400 font-medium">
                              {route.transfers === 0 ? 'Direct' : `${route.transfers} transfer`}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-100">{route.arrival_time}</p>
                            <p className="text-[10px] text-slate-400">{route.destination}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-railway-border/60">
                          <span className="font-bold text-emerald-400 text-sm">₹{route.fare_inr}</span>
                          <button
                            onClick={() =>
                              navigate('/booking/review', { state: { route } })
                            }
                            className="px-2.5 py-1 rounded-lg bg-railway-teal hover:bg-sky-400 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            Book This Route <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {m.suggested_routes.length > 5 && m.extracted && (
                    <div className="pt-1 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            `/routes?origin=${encodeURIComponent(m.extracted.origin)}&destination=${encodeURIComponent(
                              m.extracted.destination
                            )}&date=${m.extracted.travel_date}&pref=${m.extracted.preference || 'fastest'}`
                          )
                        }
                        className="text-xs text-railway-teal hover:underline font-semibold"
                      >
                        View all {m.suggested_routes.length} ranked options in Route Comparison →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp & Agent info */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>{m.timestamp}</span>
                {m.agent && <span>• Handled by {m.agent}</span>}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-railway-slate text-railway-teal border border-railway-teal/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-railway-card border border-railway-border text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-railway-teal animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-railway-teal animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-railway-teal animate-bounce delay-300" />
              <span>Orchestrating agents & querying railway network...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-railway-card border border-railway-border shadow-xl"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="E.g., Find the cheapest route from Mumbai to Jaipur on 20 December with no more than 1 change..."
          disabled={loading}
          className="flex-1 px-4 py-3 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-railway-teal hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send Request</span>
        </button>
      </form>
    </div>
  );
};

export default TravelAssistantPage;
