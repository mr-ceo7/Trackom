import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Megaphone, Coins, Calendar, Plus, X, 
  Send, ShieldAlert, ArrowDownRight, MessageSquare, Key,
  Edit, Sparkles, Sliders, Palette, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';
import { useAuth } from '../../contexts/AuthContext';


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
  credit_rate: number;
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
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [users, setUsers] = useState<ResellerUser[]>([]);
  const [logs, setLogs] = useState<ResellerMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'logs' | 'branding'>('clients');

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

  // Edit Client Modal
  const [editingUser, setEditingUser] = useState<ResellerUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Branding Panel States
  const [brandName, setBrandName] = useState(user?.custom_brand_name || '');
  const [logoUrl, setLogoUrl] = useState(user?.custom_logo_url || '');
  const [brandColor, setBrandColor] = useState(user?.custom_primary_color || '#6366F1');
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  // Sync branding states when user loads
  useEffect(() => {
    if (user) {
      setBrandName(user.custom_brand_name || '');
      setLogoUrl(user.custom_logo_url || '');
      setBrandColor(user.custom_primary_color || '#6366F1');
    }
  }, [user]);

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
    if (!childName || !childEmail) return;

    setSubmittingCreate(true);
    try {
      await api.post('/reseller/users', {
        full_name: childName,
        email: childEmail,
        phone: childPhone || undefined,
        company: childCompany || undefined
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

  // Edit Child Handler
  const handleEditChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEdit(true);
    try {
      await api.put(`/reseller/users/${editingUser.id}`, {
        full_name: editName,
        phone: editPhone || undefined,
        company: editCompany || undefined,
        credit_rate: parseFloat(editRate) || 1.0,
        is_active: editActive
      });
      setIsEditOpen(false);
      setEditingUser(null);
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update client.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Branding Update Handler
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    setBrandingSuccess(false);
    try {
      await api.put('/reseller/branding', {
        custom_logo_url: logoUrl || undefined,
        custom_brand_name: brandName || undefined,
        custom_primary_color: brandColor || undefined
      });
      await refreshUser();
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update branding settings.');
    } finally {
      setSavingBranding(false);
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
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Manage credit wallets, customize white-labeling, and monitor client routing activity.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader size="md" /></div>
      ) : (
        <>
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'My Pool Balance', value: `${stats?.reseller_balance?.toLocaleString() || 0} cr`, desc: 'Available for client allocations', icon: Coins, color: 'text-brand-primary', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' },
              { label: 'My Sub-accounts', value: stats?.total_clients || 0, desc: 'Registered tenant integrations', icon: Users, color: 'text-brand-accent', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' },
              { label: 'Client Messages Sent', value: stats?.total_sms_sent?.toLocaleString() || 0, desc: 'Aggregated reseller dispatches', icon: Megaphone, color: 'text-brand-emerald', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
            ].map((card, idx) => (
              <div key={idx} className="clay-stat rounded-3xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}><card.icon className={`w-6 h-6 ${card.color} ${card.glow}`} /></div>
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
            {[
              { id: 'clients', label: 'My Clients', icon: Users },
              { id: 'logs', label: 'Real-time Sub-user Logs', icon: MessageSquare },
              { id: 'branding', label: 'White-label Branding', icon: Palette }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'border-brand-primary text-brand-primary dark:text-brand-primary-light' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'clients' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Referral Link Widget */}
              <div className="clay-card rounded-3xl p-5 bg-gradient-to-r from-brand-primary/10 via-brand-accent/5 to-transparent border border-brand-primary/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                    <span>Client Referral Link</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Share this link to automatically onboard clients directly under your reseller account.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/register?type=business&ref=${user?.id}`}
                    className="clay-input px-3 py-2 rounded-xl text-xs font-mono select-all bg-slate-100/50 dark:bg-black/10 border-0 outline-none w-full md:w-80"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register?type=business&ref=${user?.id}`);
                      alert('Referral link copied to clipboard!');
                    }}
                    className="clay-button-secondary px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

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
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Client User</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Company</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">SMS Rate</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">SMS Balance</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Status</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                          <td className="px-2 sm:px-5 py-2 sm:py-3">
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{u.full_name}</div>
                              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[100px] sm:max-w-none">{u.email}</div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs text-slate-600 dark:text-gray-400 truncate max-w-[80px] sm:max-w-none">{u.company || ' - '}</td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3">
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10 font-mono">
                              KES {u.credit_rate.toFixed(2)}/SMS
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white">
                            {u.sms_balance.toLocaleString()} cr
                          </td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase ${
                              u.is_active ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {u.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedUser(u); setIsTransferOpen(true); }}
                                className="clay-button-secondary px-3 py-1.5 rounded-xl text-brand-primary text-xs font-semibold cursor-pointer transition-all"
                              >
                                Allocate Credits
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditName(u.full_name);
                                  setEditPhone(u.phone || '');
                                  setEditCompany(u.company || '');
                                  setEditRate(u.credit_rate.toString());
                                  setEditActive(u.is_active);
                                  setIsEditOpen(true);
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-brand-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                                title="Edit Client Details & Rate"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-16">
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
            <div className="space-y-4 animate-fadeIn">
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
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Sub-User Account</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Recipient</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Message</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Status</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Cost</th>
                        <th className="px-2 sm:px-5 py-2 sm:py-3.5 text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{log.user_name}</td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs font-mono font-bold text-slate-900 dark:text-white">{log.recipient}</td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs text-slate-600 dark:text-gray-400 max-w-[120px] sm:max-w-xs truncate">{log.content}</td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase ${
                              log.status === 'delivered' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs font-mono text-slate-900 dark:text-white">{log.cost.toFixed(2)} cr</td>
                          <td className="px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</td>
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

          {activeTab === 'branding' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">White-label Branding Settings</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Rebrand your clients' portals with your own business logo, name, and color theme.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Configuration Form */}
                <div className="md:col-span-2 clay-card rounded-3xl p-6 space-y-4">
                  {brandingSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Branding configurations updated successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveBranding} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Custom Portal Name</label>
                      <input 
                        type="text" 
                        value={brandName} 
                        onChange={e => setBrandName(e.target.value)} 
                        placeholder="e.g. Mwangi SMS Solutions" 
                        className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                        required 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Logo Image URL</label>
                      <input 
                        type="url" 
                        value={logoUrl} 
                        onChange={e => setLogoUrl(e.target.value)} 
                        placeholder="e.g. https://domain.com/assets/logo.png" 
                        className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Primary Brand Color</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={brandColor} 
                          onChange={e => setBrandColor(e.target.value)} 
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-slate-800" 
                        />
                        <input 
                          type="text" 
                          value={brandColor} 
                          onChange={e => setBrandColor(e.target.value)} 
                          placeholder="#6366F1" 
                          className="clay-input px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none w-32 font-mono uppercase" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={savingBranding} 
                      className="clay-button-primary px-6 py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {savingBranding ? <Loader size="sm" /> : <span>Apply White-label Branding</span>}
                    </button>
                  </form>
                </div>

                {/* Preview Card */}
                <div className="clay-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preview Card</h4>
                    
                    {/* Fake Header */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded" />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">T</div>
                        )}
                        <span className="text-xs font-black text-slate-900 dark:text-white">{brandName || 'Trackom'}</span>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* Fake Dashboard Button */}
                    <div 
                      className="p-3 rounded-2xl text-white text-xs font-bold text-center flex items-center justify-center gap-1"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Explore Portal</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">This card displays a live mockup of how your logo, custom brand name, and color theme will render on your clients' portals.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Credit Transfer Modal */}
      <AnimatePresence>
        {isTransferOpen && selectedUser && (
          <GenieModal onClose={() => setIsTransferOpen(false)} className="p-6">
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
                {submittingTransfer ? <Loader size="sm" /> : <span>Confirm Transfer</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Register Sub-account Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <GenieModal onClose={() => setIsCreateOpen(false)} className="p-6">
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
                <input type="email" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="james@company.co.ke" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Phone (Optional)</label>
                  <input type="tel" value={childPhone} onChange={(e) => setChildPhone(e.target.value)} placeholder="0712345678" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Company (Optional)</label>
                  <input type="text" value={childCompany} onChange={(e) => setChildCompany(e.target.value)} placeholder="Mwangi Builders" className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                </div>
              </div>

              {/* No password field - client will set it via invite link */}

              <button type="submit" disabled={submittingCreate} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                {submittingCreate ? <Loader size="sm" /> : <span>Create Client Account</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Edit Sub-account Modal */}
      <AnimatePresence>
        {isEditOpen && editingUser && (
          <GenieModal onClose={() => setIsEditOpen(false)} className="p-6">
            <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-primary" />
                <span>Configure Client Profile</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleEditChild} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Phone</label>
                  <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Company</label>
                  <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">SMS Markup Rate (KES per SMS)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={editRate} 
                  onChange={e => setEditRate(e.target.value)} 
                  placeholder="e.g. 0.25"
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none font-mono" 
                  required 
                />
                <p className="text-[10px] text-slate-400">Determines client billing rate per SMS credit when topping up.</p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Account Status</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditActive(true)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                      editActive 
                        ? 'clay-nav-active text-brand-primary border-brand-primary' 
                        : 'clay-button-secondary border-transparent'
                    }`}
                  >
                    Active / Enabled
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditActive(false)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                      !editActive 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : 'clay-button-secondary border-transparent'
                    }`}
                  >
                    Suspended
                  </button>
                </div>
              </div>

              <button type="submit" disabled={submittingEdit} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                {submittingEdit ? <Loader size="sm" /> : <span>Update Client configurations</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
