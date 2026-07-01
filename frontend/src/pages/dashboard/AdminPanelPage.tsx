import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Megaphone, Zap, ShieldAlert, Search, Plus, Minus, 
  Check, X, Ban, UserCheck, Loader2, Coins, Calendar, Sliders, 
  Cpu, Key, Link as LinkIcon, Edit, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../services/api';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_campaigns: number;
  total_sms_sent: number;
  success_rate: number;
  system_balance: number;
}

interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  company: string | null;
  account_type: 'business' | 'reseller';
  plan: 'starter' | 'growth' | 'enterprise';
  sms_balance: number;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  credit_rate: number;
  created_at: string;
}

interface SmsGatewayConfig {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  weight: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'gateways'>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [gateways, setGateways] = useState<SmsGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  
  // Credit Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [creditDesc, setCreditDesc] = useState<string>('');
  const [submittingCredits, setSubmittingCredits] = useState(false);

  // Rate Modal state
  const [selectedRateUser, setSelectedRateUser] = useState<AdminUser | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [customRate, setCustomRate] = useState<string>('1.0');
  const [submittingRate, setSubmittingRate] = useState(false);

  // Gateway Modal state
  const [selectedGateway, setSelectedGateway] = useState<SmsGatewayConfig | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gwName, setGwName] = useState('');
  const [gwUrl, setGwUrl] = useState('');
  const [gwKey, setGwKey] = useState('');
  const [gwWeight, setGwWeight] = useState(50);
  const [gwActive, setGwActive] = useState(true);
  const [submittingGateway, setSubmittingGateway] = useState(false);

  // Fetch admin statistics
  const fetchStats = useCallback(async () => {
    try {
      const resp = await api.get('/admin/stats');
      setStats(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  // Fetch registered users list
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const resp = await api.get('/admin/users', {
        params: {
          page,
          limit,
          ...(search ? { search } : {})
        }
      });
      setUsers(resp.data);
    } catch { /* noop */ }
    finally { setLoadingUsers(false); }
  }, [page, limit, search]);

  // Fetch gateways list
  const fetchGateways = useCallback(async () => {
    setLoadingGateways(true);
    try {
      const resp = await api.get('/admin/gateways');
      setGateways(resp.data);
    } catch { /* noop */ }
    finally { setLoadingGateways(false); }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchGateways();
    }
  }, [activeTab, fetchUsers, fetchGateways]);

  // Adjust User Wallet Credits
  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !creditAmount) return;
    const amountVal = parseInt(creditAmount, 10);
    if (isNaN(amountVal) || amountVal === 0) return;

    setSubmittingCredits(true);
    try {
      await api.post(`/admin/users/${selectedUser.id}/credits`, {
        amount: amountVal,
        description: creditDesc || undefined
      });
      setIsCreditModalOpen(false);
      setCreditAmount('');
      setCreditDesc('');
      setSelectedUser(null);
      await fetchUsers();
      await fetchStats();
    } catch { /* noop */ }
    finally { setSubmittingCredits(false); }
  };

  // Update Tenant Custom SMS Rate
  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRateUser || !customRate) return;
    const rateVal = parseFloat(customRate);
    if (isNaN(rateVal) || rateVal <= 0) return;

    setSubmittingRate(true);
    try {
      await api.post(`/admin/users/${selectedRateUser.id}/rate`, {
        credit_rate: rateVal
      });
      setIsRateModalOpen(false);
      setSelectedRateUser(null);
      await fetchUsers();
    } catch { /* noop */ }
    finally { setSubmittingRate(false); }
  };

  // Toggle User Active Account Status
  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = !user.is_active;
    const confirmMsg = nextStatus
      ? `Are you sure you want to reactivate the account for ${user.full_name}?`
      : `Are you sure you want to suspend the account for ${user.full_name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.post(`/admin/users/${user.id}/status`, { is_active: nextStatus });
      await fetchUsers();
      await fetchStats();
    } catch { /* noop */ }
  };

  // Create or Update SMS Gateway
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwName || !gwUrl || !gwKey) return;

    setSubmittingGateway(true);
    try {
      await api.post('/admin/gateways', {
        name: gwName,
        api_url: gwUrl,
        api_key: gwKey,
        weight: gwWeight,
        is_active: gwActive
      }, {
        params: selectedGateway ? { gateway_id: selectedGateway.id } : {}
      });
      setIsGatewayModalOpen(false);
      setSelectedGateway(null);
      setGwName('');
      setGwUrl('');
      setGwKey('');
      setGwWeight(50);
      setGwActive(true);
      await fetchGateways();
    } catch { /* noop */ }
    finally { setSubmittingGateway(false); }
  };

  // Delete Gateway
  const handleDeleteGateway = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMS Gateway API configuration?")) return;
    try {
      await api.delete(`/admin/gateways/${id}`);
      await fetchGateways();
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Control Panel</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">SaaS gateway wallet administration & tenant control center.</p>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-brand-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: stats?.total_users || 0, desc: `${stats?.active_users || 0} active SaaS tenants`, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { label: 'Total Campaigns', value: stats?.total_campaigns || 0, desc: 'Dispatches initialized', icon: Megaphone, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { label: 'Overall SMS Sent', value: stats?.total_sms_sent?.toLocaleString() || 0, desc: `Success Rate: ${stats?.success_rate || 100}%`, icon: Zap, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
            { label: 'Gateway API Pool', value: `${stats?.system_balance?.toLocaleString() || 0} cr`, desc: 'Global wholesale credits', icon: Coins, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((card, idx) => (
            <div key={idx} className="clay-stat rounded-3xl p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-[10px] text-slate-400 dark:text-gray-500 font-semibold uppercase tracking-wider">{card.label}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{card.value}</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all cursor-pointer border-b-2 px-1 ${
            activeTab === 'users' 
              ? 'border-brand-primary text-brand-primary dark:text-brand-primary-light' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
        >
          Tenant Users
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all cursor-pointer border-b-2 px-1 ${
            activeTab === 'gateways' 
              ? 'border-brand-primary text-brand-primary dark:text-brand-primary-light' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
        >
          SMS Gateway Balancing
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              className="clay-input w-full pl-11 pr-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
              placeholder="Search tenant emails, names, or companies..." 
            />
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="text-center py-16"><Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto" /></div>
          ) : (
            <div className="clay-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Tenant</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Plan & Rate</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Wallet Balance</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Created At</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr 
                        key={u.id} 
                        className={`border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${
                          !u.is_active ? 'opacity-60 bg-slate-100/30 dark:bg-white/[0.005]' : ''
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              u.is_superuser 
                                ? 'bg-red-500/20 text-red-500 border border-red-500/20' 
                                : 'bg-brand-primary/20 text-brand-primary'
                            }`}>
                              {u.is_superuser ? 'AD' : u.full_name.slice(0,2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{u.full_name}</span>
                                {u.is_superuser && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/10 font-mono uppercase">Owner</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 font-mono">
                                <span>{u.email}</span>
                                {u.phone && <span>· {u.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.plan === 'enterprise' 
                                ? 'bg-purple-500/10 text-purple-400' 
                                : u.plan === 'growth' 
                                ? 'bg-brand-accent/10 text-brand-accent' 
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {u.plan}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10 font-mono">
                              {u.credit_rate.toFixed(2)} cr/SMS
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-sm font-bold font-mono text-slate-900 dark:text-white">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span>{u.sms_balance.toLocaleString()} cr</span>
                          </div>
                        </td>

                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-gray-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex gap-2">
                            {/* SMS Rate Button */}
                            <button
                              onClick={() => { setSelectedRateUser(u); setCustomRate(u.credit_rate.toString()); setIsRateModalOpen(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer transition-all"
                              title="Assign account SMS rate"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>

                            {/* Credits Button */}
                            <button
                              onClick={() => { setSelectedUser(u); setIsCreditModalOpen(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-all"
                              title="Adjust wallet credits"
                            >
                              <Coins className="w-4 h-4" />
                            </button>

                            {/* Toggle Active Switch */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                u.is_active
                                  ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                  : 'text-slate-400 hover:text-brand-emerald hover:bg-brand-emerald/10'
                              }`}
                              title={u.is_active ? 'Suspend account' : 'Reactivate account'}
                              disabled={u.is_superuser}
                            >
                              {u.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <Users className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 dark:text-gray-400">No registered users matched search filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-primary" />
              <span>Gateway API Allocation List</span>
            </h3>
            <button
              onClick={() => { setSelectedGateway(null); setGwName(''); setGwUrl(''); setGwKey(''); setGwWeight(50); setGwActive(true); setIsGatewayModalOpen(true); }}
              className="clay-button-primary flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add API Gateway</span>
            </button>
          </div>

          {loadingGateways ? (
            <div className="text-center py-16"><Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gateways.map((gw) => (
                <div 
                  key={gw.id} 
                  className={`clay-card rounded-3xl p-5 flex flex-col justify-between space-y-4 ${
                    !gw.is_active ? 'opacity-60 bg-slate-100/10' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <Cpu className="w-4 h-4 text-brand-primary" />
                        <span>{gw.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
                        gw.is_active ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {gw.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-left">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                        <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono truncate">{gw.api_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                        <Key className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono">••••••••••••</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Load Split Weight</div>
                      <div className="text-lg font-black text-brand-primary font-mono">{gw.weight}%</div>
                    </div>
                    
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedGateway(gw);
                          setGwName(gw.name);
                          setGwUrl(gw.api_url);
                          setGwKey(gw.api_key);
                          setGwWeight(gw.weight);
                          setGwActive(gw.is_active);
                          setIsGatewayModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-all"
                        title="Edit gateway parameters"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGateway(gw.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all"
                        title="Delete gateway config"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {gateways.length === 0 && (
                <div className="col-span-full text-center py-16 clay-card rounded-3xl">
                  <Cpu className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No API Gateways configured</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm mx-auto">Configure custom SMS Gateway endpoints with percentage allocations to distribute outgoing dispatches.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Credit Adjustment Popup Modal */}
      <AnimatePresence>
        {isCreditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreditModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="clay-card w-full max-w-md rounded-3xl p-6 relative z-10 text-left dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Coins className="w-5 h-5 text-amber-500" /><span>Adjust Wallet Credits</span></h3>
                <button onClick={() => setIsCreditModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="clay-inset rounded-2xl p-3 mb-4 text-xs space-y-1">
                <div>User: <span className="font-bold text-slate-900 dark:text-white">{selectedUser.full_name}</span></div>
                <div>Email: <span className="font-mono text-slate-500 dark:text-gray-400">{selectedUser.email}</span></div>
                <div>Current Balance: <span className="font-bold text-brand-emerald font-mono">{selectedUser.sms_balance.toLocaleString()} credits</span></div>
              </div>

              <form onSubmit={handleAdjustCredits} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Adjustment Amount (credits)</label>
                  <input type="text" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Use positive numbers to add, negative (e.g. -500) to deduct" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Audit Description</label>
                  <textarea value={creditDesc} onChange={e => setCreditDesc(e.target.value)} placeholder="Enter audit reference or refund note..." rows={3} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                </div>
                <button type="submit" disabled={submittingCredits || !creditAmount} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                  {submittingCredits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Apply Credit Adjustment</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SMS Rate Modal */}
      <AnimatePresence>
        {isRateModalOpen && selectedRateUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRateModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="clay-card w-full max-w-md rounded-3xl p-6 relative z-10 text-left dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Sliders className="w-5 h-5 text-amber-500" /><span>Set Account SMS Rate</span></h3>
                <button onClick={() => setIsRateModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="clay-inset rounded-2xl p-3 mb-4 text-xs space-y-1">
                <div>User: <span className="font-bold text-slate-900 dark:text-white">{selectedRateUser.full_name}</span></div>
                <div>Email: <span className="font-mono text-slate-500 dark:text-gray-400">{selectedRateUser.email}</span></div>
                <div>Current Rate: <span className="font-bold text-amber-500 font-mono">{selectedRateUser.credit_rate.toFixed(2)} cr/SMS</span></div>
              </div>

              <form onSubmit={handleUpdateRate} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Rate Multiplier (credits per SMS)</label>
                  <input type="number" step="0.01" min="0.01" value={customRate} onChange={e => setCustomRate(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                  <p className="text-[10px] text-slate-400">Default rate is 1.00 (1 SMS = 1 credit). Use smaller values for custom wholesale discounts (e.g. 0.70 cr/SMS).</p>
                </div>
                <button type="submit" disabled={submittingRate || !customRate} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                  {submittingRate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Update Custom Rate</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gateway API Configuration Modal */}
      <AnimatePresence>
        {isGatewayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGatewayModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="clay-card w-full max-w-md rounded-3xl p-6 relative z-10 text-left dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-brand-primary" />
                  <span>{selectedGateway ? 'Edit API Gateway' : 'Add API Gateway'}</span>
                </h3>
                <button onClick={() => setIsGatewayModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSaveGateway} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Gateway Provider Name</label>
                  <input type="text" value={gwName} onChange={e => setGwName(e.target.value)} placeholder="e.g. Africa's Talking API, Twilio Endpoint" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">API URL Connection Endpoint</label>
                  <input type="url" value={gwUrl} onChange={e => setGwUrl(e.target.value)} placeholder="https://api.gateway.com/v1/sms" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Secret Security Token / Auth Key</label>
                  <input type="text" value={gwKey} onChange={e => setGwKey(e.target.value)} placeholder="Enter API authentication password or credentials token" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Load Splitting Weight (%)</label>
                    <span className="text-sm font-bold text-brand-primary font-mono">{gwWeight}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={gwWeight} 
                    onChange={e => setGwWeight(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary" 
                  />
                  <p className="text-[10px] text-slate-400">Determines the percentage probability of outgoing messages being routed to this node compared to other active endpoints.</p>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-b border-slate-200/20 dark:border-white/5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">Gateway Active Status</span>
                  <button 
                    type="button" 
                    onClick={() => setGwActive(!gwActive)}
                    className="text-brand-primary cursor-pointer hover:scale-105 transition-all"
                  >
                    {gwActive ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
                  </button>
                </div>

                <button type="submit" disabled={submittingGateway} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                  {submittingGateway ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save API Gateway</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
