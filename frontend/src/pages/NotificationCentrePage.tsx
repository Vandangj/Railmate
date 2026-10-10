import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Clock, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Notification } from '../types';

const NotificationCentrePage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = notifications.filter((n) => (filter === 'all' ? true : !n.is_read));

  const getIcon = (kind: string) => {
    switch (kind) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-railway-card border border-railway-border shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-railway-teal" />
            Notification Centre
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System alerts, booking confirmation events, and journey update logs
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-railway-navy hover:bg-railway-slate text-railway-teal text-xs font-semibold border border-railway-border flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-railway-border/60 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
            filter === 'all'
              ? 'bg-railway-teal text-white shadow-sm'
              : 'bg-railway-card text-slate-400 hover:text-white border border-railway-border/60'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
            filter === 'unread'
              ? 'bg-railway-teal text-white shadow-sm'
              : 'bg-railway-card text-slate-400 hover:text-white border border-railway-border/60'
          }`}
        >
          Unread ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-railway-card border border-railway-border animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-railway-card border border-railway-border rounded-3xl space-y-3">
          <Bell className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No notifications</h3>
          <p className="text-xs text-slate-400">All caught up! Notifications from bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                item.is_read
                  ? 'bg-railway-card/70 border-railway-border/60 text-slate-400'
                  : 'bg-railway-card border-railway-border shadow-lg text-slate-200'
              }`}
            >
              <div className="mt-1">{getIcon(item.kind)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <span className="text-[11px] text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{item.message}</p>
                <div className="flex items-center gap-3 pt-2">
                  {item.link && (
                    <Link
                      to={item.link}
                      className="text-xs text-railway-teal hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      View Trip <LinkIcon className="w-3 h-3" />
                    </Link>
                  )}
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCentrePage;
