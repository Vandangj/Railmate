import React, { useState, useEffect } from 'react';
import { Shield, Activity, Users, Ticket, GitCommit, CheckCircle, AlertTriangle, RefreshCw, Cpu, Server, Database, Filter } from 'lucide-react';
import { api } from '../api/client';
import { AdminOverview, AgentLog } from '../types';

const AdminDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [overviewData, logsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminAgentLogs(selectedAgentFilter || undefined),
      ]);
      setOverview(overviewData);
      setAgentLogs(logsData);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAgentFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-railway-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = overview?.metrics;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-railway-card to-railway-navy border border-purple-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">RailMate Administrative Oversight</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System activity metrics, multi-agent dispatch monitoring, and provider health telemetry
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/60 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-railway-card border border-railway-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics?.total_users ?? 0}</div>
          <p className="text-[11px] text-slate-500">Registered Travelers</p>
        </div>

        <div className="p-5 rounded-2xl bg-railway-card border border-railway-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Reservations</span>
            <Ticket className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics?.total_bookings ?? 0}</div>
          <p className="text-[11px] text-slate-500">
            {metrics?.confirmed_bookings ?? 0} active, {metrics?.cancelled_bookings ?? 0} cancelled
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-railway-card border border-railway-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Route Searches</span>
            <GitCommit className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{metrics?.total_searches ?? 0}</div>
          <p className="text-[11px] text-slate-500">NetworkX solver executions</p>
        </div>

        <div className="p-5 rounded-2xl bg-railway-card border border-railway-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Agent Cycles</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400">{metrics?.active_agent_calls ?? 0}</div>
          <p className="text-[11px] text-slate-500">Orchestrator dispatch logs</p>
        </div>
      </div>

      {/* Provider Health Section */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Server className="w-4 h-4 text-railway-teal" />
          Subsystem & Provider Health
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {overview?.provider_health?.map((prov, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-railway-navy border border-railway-border/60 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{prov.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    prov.status === 'OPERATIONAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {prov.status}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{prov.details}</p>
              <div className="text-[10px] text-slate-500 pt-1">
                Internal Response Latency: <strong className="text-slate-300">{prov.latency_ms} ms</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Agent Execution Logs */}
      <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Multi-Agent Execution Logs ({agentLogs.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspecting execution status, runtime ms, and action dispatched across the 5 agents
            </p>
          </div>

          {/* Filter by agent */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-railway-navy border border-railway-border text-xs text-slate-200 focus:outline-none focus:border-railway-teal"
            >
              <option value="">All Agents</option>
              <option value="Natural Language Understanding Agent">NLU Agent</option>
              <option value="Route Planning Agent">Route Planning Agent</option>
              <option value="Booking Agent">Booking Agent</option>
              <option value="Reservation Management Agent">Reservation Agent</option>
              <option value="Notification Agent">Notification Agent</option>
              <option value="Central Orchestrator">Central Orchestrator</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-railway-border/40">
            <thead className="bg-railway-navy text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Execution Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railway-border/30 text-slate-300">
              {agentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No execution logs found.
                  </td>
                </tr>
              ) : (
                agentLogs.slice(0, 25).map((log) => (
                  <tr key={log.id} className="hover:bg-railway-navy/50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{log.agent_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-sky-400">{log.action}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{log.execution_time_ms} ms</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.detail)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bookings Table */}
      {overview?.recent_bookings && overview.recent_bookings.length > 0 && (
        <div className="p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-400" />
            Recent Booking Records
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-railway-border/40">
              <thead className="bg-railway-navy text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Origin → Destination</th>
                  <th className="py-3 px-4">Travel Date</th>
                  <th className="py-3 px-4">Train</th>
                  <th className="py-3 px-4">Fare</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-railway-border/30 text-slate-300">
                {overview.recent_bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-railway-navy/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-railway-teal">{b.booking_ref}</td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {b.origin} → {b.destination}
                    </td>
                    <td className="py-3 px-4 text-amber-400">{b.travel_date}</td>
                    <td className="py-3 px-4 text-slate-300">{b.train_name}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">₹{b.fare_inr}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
