import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, TrendingUp, MessageSquare, CheckCircle2, XCircle, 
  Clock, Search, Download, Calendar, ShieldAlert, Coins
} from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

interface MessageLog {
  id: string;
  recipient: string;
  content: string;
  sender_id: string;
  status: string;
  cost: number;
  batch_number: string | null;
  sent_at: string | null;
  created_at: string;
}

export default function ReportsPage() {
  const { user, refreshUser } = useAuth();
  const [activeView, setActiveView] = useState<'history' | 'scheduled'>('history');

  // History states
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({ total_sent: 0, sent_today: 0, balance: 0 });
  const [batchFilter, setBatchFilter] = useState('');
  const [debouncedBatchFilter, setDebouncedBatchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBatchFilter(batchFilter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [batchFilter]);

  // Scheduled states
  const [scheduledMessages, setScheduledMessages] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/messages/history', {
        params: {
          page,
          limit,
          ...(debouncedBatchFilter ? { batch_number: debouncedBatchFilter } : {}),
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {})
        }
      });
      setMessages(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [page, limit, debouncedBatchFilter, startDate, endDate]);

  const fetchScheduled = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const resp = await api.get('/messages/history', {
        params: {
          limit: 100,
          status: 'scheduled'
        }
      });
      setScheduledMessages(resp.data);
    } catch { /* noop */ }
    finally { setLoadingScheduled(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const resp = await api.get('/messages/stats');
      setStats(resp.data);
    } catch { /* noop */ }
    finally { setLoadingStats(false); }
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      fetchHistory();
    } else {
      fetchScheduled();
    }
  }, [activeView, fetchHistory, fetchScheduled]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCancelScheduled = async (msgId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message? The credits spent will be refunded to your balance.')) {
      return;
    }
    try {
      await api.delete(`/messages/scheduled/${msgId}`);
      alert('Scheduled message cancelled and credits refunded successfully.');
      fetchScheduled();
      fetchStats();
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel scheduled message.');
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const response = await api.get(`/messages/export/${format}`, {
        params: {
          batch_number: batchFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        },
        responseType: 'blob'
      });
      
      const ext = format === 'xlsx' ? 'xls' : format === 'pdf' ? 'html' : 'csv';
      const filename = `sms_report_${batchFilter || 'all'}.${ext}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to generate export file.');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'bg-brand-emerald/10 text-brand-emerald';
    if (s === 'failed' || s === 'rejected') return 'bg-red-500/10 text-red-500';
    if (s === 'scheduled') return 'bg-purple-500/10 text-purple-500';
    return 'bg-amber-500/10 text-amber-500'; // queued / sending
  };

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats.total_sent.toLocaleString(), icon: MessageSquare, color: 'text-brand-primary', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' },
          { label: 'Messages Today', value: stats.sent_today.toLocaleString(), icon: CheckCircle2, color: 'text-brand-emerald', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
          { label: 'Carrier Delivery', value: '99.2%', icon: Clock, color: 'text-amber-500', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' },
          { label: 'Credit Rate', value: `${user?.credit_rate?.toFixed(2) || '1.00'} cr/SMS`, icon: Coins, color: 'text-purple-500', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' },
        ].map(s => (
          <div key={s.label} className="clay-stat rounded-3xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}><s.icon className={`w-5 h-5 ${s.color} ${s.glow}`} /></div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono leading-none">{s.value}</div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/6 pt-2">
        <button
          onClick={() => setActiveView('history')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeView === 'history' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Delivery Logs
        </button>
        <button
          onClick={() => setActiveView('scheduled')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeView === 'scheduled' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Scheduled Queue
        </button>
      </div>

      {/* Content wrapper */}
      <div className="space-y-4">
        {activeView === 'history' ? (
          <>
            {/* Filters Card */}
            <div className="clay-card rounded-3xl p-5 space-y-4 dark:border dark:border-white/10">
              <div className="text-xs font-semibold text-slate-700 dark:text-gray-300">Filter History Logs</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={batchFilter} 
                    onChange={e => setBatchFilter(e.target.value)} 
                    className="w-full pl-11 pr-4 py-3 rounded-2xl clay-input text-slate-900 dark:text-white focus:outline-none text-xs transition-all" 
                    placeholder="Batch Tracking Number..." 
                  />
                </div>
                
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 z-10 pointer-events-none">Start</span>
                  <input 
                    type="datetime-local" 
                    value={startDate} 
                    onChange={e => { setStartDate(e.target.value); setPage(1); }} 
                    className="w-full pl-14 pr-4 py-3 rounded-2xl clay-input text-slate-900 dark:text-white focus:outline-none text-xs transition-all font-mono" 
                  />
                </div>
                
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 z-10 pointer-events-none">End</span>
                  <input 
                    type="datetime-local" 
                    value={endDate} 
                    onChange={e => { setEndDate(e.target.value); setPage(1); }} 
                    className="w-full pl-14 pr-4 py-3 rounded-2xl clay-input text-slate-900 dark:text-white focus:outline-none text-xs transition-all font-mono" 
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-3.5 border-t border-slate-200/20 dark:border-white/5">
                <div>
                  {(startDate || endDate || batchFilter) ? (
                    <button 
                      onClick={() => { setStartDate(''); setEndDate(''); setBatchFilter(''); setPage(1); }}
                      className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline cursor-pointer transition-all"
                    >
                      Clear Active Filters
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-gray-500">Specify dates, times, or batches to refine results.</span>
                  )}
                </div>
                
                <div className="inline-flex gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-1.5 px-4 py-2.5 clay-button-secondary rounded-2xl text-xs font-bold text-slate-600 dark:text-gray-300 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="flex items-center gap-1.5 px-4 py-2.5 clay-button-secondary rounded-2xl text-xs font-bold text-slate-600 dark:text-gray-300 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-1.5 px-4 py-2.5 clay-button-primary rounded-2xl text-xs font-bold cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF / Print</span>
                  </button>
                </div>
              </div>
            </div>

            {/* History Table */}
            {loading ? (
              <div className="text-center py-12"><Loader size="md" /></div>
            ) : (
              <div className="clay-card rounded-3xl overflow-hidden dark:border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Recipient</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Message Content</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Sender & Batch</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Status</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Cost</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((m) => {
                        const isRowExpanded = expandedMessageId === m.id;
                        return (
                          <tr 
                            key={m.id} 
                            onClick={() => setExpandedMessageId(isRowExpanded ? null : m.id)}
                            className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 clay-row-hover hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white">
                              {m.recipient}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-600 dark:text-gray-300 max-w-xs">
                              {isRowExpanded ? (
                                <div className="font-sans whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/30 dark:border-white/5 shadow-inner leading-relaxed">
                                  {m.content}
                                </div>
                              ) : (
                                <div className="truncate">{m.content}</div>
                              )}
                            </td>
                            <td className="px-5 py-3 text-left">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white font-mono">{m.sender_id}</div>
                              {m.batch_number && (
                                <div className="text-[10px] text-brand-primary font-mono mt-0.5">{m.batch_number}</div>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(m.status)}`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-mono text-slate-900 dark:text-white">
                              {m.cost.toFixed(2)} cr
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500 dark:text-gray-400 font-mono">
                              {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ' - '}
                            </td>
                          </tr>
                        );
                      })}
                      {messages.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-16">
                            <BarChart3 className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-gray-400">No message history matches your criteria.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-3 border-t border-slate-200/20 dark:border-white/6 flex items-center justify-between text-xs text-slate-500">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={messages.length < limit}
                    className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Scheduled Messages Table */
          loadingScheduled ? (
            <div className="text-center py-12"><Loader size="md" /></div>
          ) : (
            <div className="clay-card rounded-3xl overflow-hidden dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Recipient</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Message Content</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Sender & Batch</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Scheduled Time</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledMessages.map((m) => {
                      const isRowExpanded = expandedMessageId === m.id;
                      return (
                        <tr 
                          key={m.id} 
                          onClick={() => setExpandedMessageId(isRowExpanded ? null : m.id)}
                          className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 clay-row-hover hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {m.recipient}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-gray-300 max-w-xs">
                            {isRowExpanded ? (
                              <div className="font-sans whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/30 dark:border-white/5 shadow-inner leading-relaxed">
                                {m.content}
                              </div>
                            ) : (
                              <div className="truncate">{m.content}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-left">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white font-mono">{m.sender_id}</div>
                            {m.batch_number && (
                              <div className="text-[10px] text-brand-primary font-mono mt-0.5">{m.batch_number}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                            {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : ' - '}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancelScheduled(m.id); }}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-500 text-xs font-bold transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {scheduledMessages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <Clock className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 dark:text-gray-400">No scheduled messages pending in the queue.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
