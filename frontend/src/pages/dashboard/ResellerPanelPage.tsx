import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Megaphone, Coins, Loader2, Calendar, Plus, X, 
  Send, ShieldAlert, ArrowDownRight, MessageSquare, Key
} from 'lucide-react';
import api from '../../services/api';

interface ResellerStats {
  total_clients: number;
  total_sms_sent: number;
  reseller_balance: number;
}

interface ResellerUser {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  company: string | null;
  plan: string;
  sms_balance: number;
  is_active: boolean;
  created_at: string;
}

interface ResellerMessageLog {
  id: string;
  recipient: string;
  content: string;
  sender_id: string | null;
  status: string;
  cost: number;
  user_name: string;
  created_at: string;
}

export default function ResellerPanelPage() {
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [users, setUsers] = useState<ResellerUser[]>([]);
  const [logs, setLogs] = useState<ResellerMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'logs'>('clients');

  // Credit Transfer Modal
  const [selectedUser, setSelectedUser] = useState<ResellerUser | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Child Creation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childCompany, setChildCompany] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const resp = await api.get('/reseller/stats');
      setStats(resp.data);
    } catch { /* noop */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const resp = await api.get('/reseller/users');
      setUsers(resp.data);
    } catch { /* noop */ }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const resp = await api.get('/reseller/history');
      setLogs(resp.data);
    } catch { /* noop */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchLogs()]);
    setLoading(false);
  }, [fetchStats, fetchUsers, fetchLogs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Credit Transfer Handler
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !transferAmount) return;
    const amountVal = parseInt(transferAmount, 10);
    if (isNaN(amountVal) || amountVal <= 0) return;

    setSubmittingTransfer(true);
    try {
      await api.post(`/reseller/users/${selectedUser.id}/credits`, {
        amount: amountVal
      });
      setIsTransferOpen(false);
      setTransferAmount('');
      setSelectedUser(null);
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Credit transfer failed.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Child Creation Handler
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!childName || !childEmail || !childPassword) return;

    setSubmittingCreate(true);
    try {
      await api.post('/reseller/users', {
        full_name: childName,
        email: childEmail,
        phone: childPhone || undefined,
        company: childCompany || undefined,
        password: childPassword
      });
      setIsCreateOpen(false);
      setChildName('');
      setChildEmail('');
      setChildPhone('');
      setChildCompany('');
      setChildPassword('');
      await loadAll();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create child account.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reseller Console</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Manage credit wallets and monitor client messaging history.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>
      ) : (
        <>
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'My Pool Balance', value: `${stats?.reseller_balance?.toLocaleString() || 0} cr`, desc: 'Available for client allocations', icon: Coins, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
              { label: 'My Sub-accounts', value: stats?.total_clients || 0, desc: 'Registered tenant integrations', icon: Users, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
              { label: 'Client Messages Sent', value: stats?.total_sms_sent?.toLocaleString() || 0, desc: 'Aggregated reseller dispatches', icon: Megaphone, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
            ].map((card, idx) => (
              <div key={idx} className="clay-stat rounded-3xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}><card.icon className={`w-6 h-6 ${card.color}`} /></div>
                <div className="space-y-0.5 text-left">
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 font-semibold uppercase tracking-wider">{card.label}</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{card.value}</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">{card.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 pb-px">
            <button
              onClick={() => setActiveTab('clients')}
              className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
                activeTab === 'clients' 
                  ? 'border-brand-primary text-brand-primary dark:text-brand-primary-light' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
            >
              My Clients
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
                activeTab === 'logs' 
                  ? 'border-brand-primary text-brand-primary dark:text-brand-primary-light' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
            >
              Real-time Sub-user Logs
            </button>
          </div>

          {activeTab === 'clients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Business Sub-accounts</h3>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="clay-button-primary flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Sub-account</span>
                </button>
              </div>

              {/* Clients Table */}
              <div className="clay-card rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Client User</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Company</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">SMS Balance</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Created At</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                          <td className="px-5 py-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{u.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-gray-400">{u.company || '—'}</td>
                          <td className="px-5 py-3 font-bold font-mono text-slate-900 dark:text-white">
                            {u.sms_balance.toLocaleString()} cr
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => { setSelectedUser(u); setIsTransferOpen(true); }}
                              className="clay-button-secondary px-3 py-1.5 rounded-2xl text-brand-primary text-xs font-semibold cursor-pointer transition-all"
                            >
                              Allocate Credits
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-16">
                            <Users className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-gray-400">No client accounts created yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-primary" />
                <span>Aggregated Sub-user Dispatch History</span>
              </h3>

              {/* Logs Table */}
              <div className="clay-card rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Sub-User Account</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Recipient</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Message</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Status</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Cost</th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                          <td className="px-5 py-3 text-xs font-semibold text-slate-900 dark:text-white">{log.user_name}</td>
                          <td className="px-5 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white">{log.recipient}</td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-gray-400 max-w-xs truncate">{log.content}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              log.status === 'delivered' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-slate-900 dark:text-white">{log.cost.toFixed(2)} cr</td>
                          <td className="px-5 py-3 text-xs text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-16">
                            <Megaphone className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-gray-400">No outbound traffic recorded from sub-users yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Credit Transfer Modal */}
      <AnimatePresence>
        {isTransferOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTransferOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="clay-card w-full max-w-md rounded-3xl p-6 relative z-10 text-left dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-brand-primary" />
                  <span>Transfer Credits</span>
                </h3>
                <button onClick={() => setIsTransferOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="clay-inset rounded-2xl p-3 mb-4 text-xs space-y-1">
                <div>Client: <span className="font-bold text-slate-900 dark:text-white">{selectedUser.full_name}</span></div>
                <div>Email: <span className="font-mono text-slate-500 dark:text-gray-400">{selectedUser.email}</span></div>
                <div>Client Current Balance: <span className="font-bold text-brand-emerald font-mono">{selectedUser.sms_balance.toLocaleString()} credits</span></div>
                <div className="h-px bg-slate-200 dark:bg-white/6 my-2" />
                <div>My Pool Balance: <span className="font-bold text-brand-primary font-mono">{stats?.reseller_balance?.toLocaleString() || 0} credits available</span></div>
              </div>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Credits to Transfer</label>
                  <input type="number" min="1" max={stats?.reseller_balance || 0} value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="Enter amount of credits to allocate..." className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>
                <button type="submit" disabled={submittingTransfer || !transferAmount} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                  {submittingTransfer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Transfer</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Register Sub-account Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="clay-card w-full max-w-md rounded-3xl p-6 relative z-10 text-left dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-primary" />
                  <span>Register Sub-account</span>
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {createError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl mb-4">{createError}</div>}

              <form onSubmit={handleCreateChild} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Client Full Name</label>
                  <input type="text" value={childName} onChange={e => setChildName(e.target.value)} placeholder="James Mwangi" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Client Email Address</label>
                  <input type="email" value={childEmail} onChange={e => setChildEmail(e.target.value)} placeholder="james@company.co.ke" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Phone (Optional)</label>
                    <input type="tel" value={childPhone} onChange={e => setChildPhone(e.target.value)} placeholder="0712345678" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Company (Optional)</label>
                    <input type="text" value={childCompany} onChange={e => setChildCompany(e.target.value)} placeholder="Mwangi Builders" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Login Password</label>
                  <input type="password" value={childPassword} onChange={e => setChildPassword(e.target.value)} placeholder="••••••••" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>

                <button type="submit" disabled={submittingCreate} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                  {submittingCreate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Create Client Account</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
