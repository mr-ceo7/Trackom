import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Megaphone, Send, ShieldAlert, Search, Plus, Minus, 
  Check, X, Ban, UserCheck, Coins, Calendar, Sliders, 
  Cpu, Key, Link as LinkIcon, Edit, Trash2, ToggleLeft, ToggleRight, Smartphone, Activity, TrendingUp, Settings, Save, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';
import TrackomLogo from '../../components/TrackomLogo';


interface MonthlyBreakdownItem {
  month: string;
  revenue: number;
}

interface DailyVolumeItem {
  label: string;
  volume: number;
}

interface DailyRevenueItem {
  label: string;
  revenue: number;
}

interface ClientDistributionItem {
  client_name: string;
  sms_balance: number;
}

interface AdminStats {
  total_users: number;
  active_users: number;
  online_users: number;
  today_users: number;
  yesterday_users: number;
  last_7d_users: number;
  total_gateways: number;
  active_gateways: number;
  monthly_revenue: number;
  today_revenue: number;
  yesterday_revenue: number;
  all_time_revenue: number;
  this_year_revenue: number;
  monthly_breakdown: MonthlyBreakdownItem[];
  daily_volumes: DailyVolumeItem[];
  daily_revenue_breakdown: DailyRevenueItem[];
  client_distributions: ClientDistributionItem[];
  total_sms_sent: number;
  total_campaigns: number;
  success_rate: number;
  delivered_sms_count: number;
  failed_sms_count: number;
  pending_sms_count: number;
  total_client_credits: number;
  paying_clients: number;
  pending_sender_ids: number;
  active_campaigns: number;
  system_balance: number;
}

interface AdminEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'gateways' | 'sender_ids' | 'campaigns' | 'transactions' | 'settings'>('dashboard');
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [gateways, setGateways] = useState<SmsGatewayConfig[]>([]);
  const [senderIds, setSenderIds] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [loadingSenderIds, setLoadingSenderIds] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [senderIdPage, setSenderIdPage] = useState(1);
  const [limit] = useState(25);

  // Advanta Approved Sender IDs & Assignment
  const [advantaSenderIds, setAdvantaSenderIds] = useState<any[]>([]);
  const [loadingAdvanta, setLoadingAdvanta] = useState(false);
  const [allUsersForSelect, setAllUsersForSelect] = useState<AdminUser[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignUserId, setSelectedAssignUserId] = useState('');
  const [selectedAssignSenderId, setSelectedAssignSenderId] = useState('');
  const [assignPurpose, setAssignPurpose] = useState('Assigned by Administrator');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Pool management states
  const [newPoolSenderId, setNewPoolSenderId] = useState('');
  const [submittingNewPoolId, setSubmittingNewPoolId] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);
  
  // Credit Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [creditDesc, setCreditDesc] = useState<string>('');
  const [submittingCredits, setSubmittingCredits] = useState(false);

  // System Settings States
  const [mpesaPaybill, setMpesaPaybill] = useState('400200');
  const [mpesaTill, setMpesaTill] = useState('900100');
  const [minDeposit, setMinDeposit] = useState(500);
  const [autoCredit, setAutoCredit] = useState(true);
  const [welcomeCredits, setWelcomeCredits] = useState(10000);
  const [baseSmsCost, setBaseSmsCost] = useState(1.0);
  const [senderIdFee, setSenderIdFee] = useState(10000);
  const [starterRate, setStarterRate] = useState(1.00);
  const [growthRate, setGrowthRate] = useState(0.85);
  const [enterpriseRate, setEnterpriseRate] = useState(0.70);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [supportEmail, setSupportEmail] = useState('support@trackom.co.ke');
  const [supportPhone, setSupportPhone] = useState('+254 700 000 000');
  const [alertBanner, setAlertBanner] = useState('');
  const [advantasmsDefaultShortcode, setAdvantasmsDefaultShortcode] = useState('ARVOCAP');
  const [savingSettings, setSavingSettings] = useState(false);

  // Load settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      const resp = await api.get('/admin/settings');
      const data = resp.data;
      if (data.mpesaPaybill) setMpesaPaybill(data.mpesaPaybill);
      if (data.mpesaTill) setMpesaTill(data.mpesaTill);
      if (data.minDeposit !== undefined) setMinDeposit(data.minDeposit);
      if (data.autoCredit !== undefined) setAutoCredit(data.autoCredit);
      if (data.welcomeCredits !== undefined) setWelcomeCredits(data.welcomeCredits);
      if (data.baseSmsCost !== undefined) setBaseSmsCost(data.baseSmsCost);
      if (data.senderIdFee !== undefined) setSenderIdFee(data.senderIdFee);
      if (data.starterRate !== undefined) setStarterRate(data.starterRate);
      if (data.growthRate !== undefined) setGrowthRate(data.growthRate);
      if (data.enterpriseRate !== undefined) setEnterpriseRate(data.enterpriseRate);
      if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
      if (data.supportEmail) setSupportEmail(data.supportEmail);
      if (data.supportPhone) setSupportPhone(data.supportPhone);
      if (data.alertBanner !== undefined) setAlertBanner(data.alertBanner);
      if (data.advantasmsDefaultShortcode) setAdvantasmsDefaultShortcode(data.advantasmsDefaultShortcode);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        mpesaPaybill, mpesaTill, minDeposit, autoCredit, welcomeCredits, baseSmsCost,
        senderIdFee, starterRate, growthRate, enterpriseRate, maintenanceMode,
        supportEmail, supportPhone, alertBanner, advantasmsDefaultShortcode
      };
      await api.put('/admin/settings', payload);
      alert('System Settings saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };


  // Rate Modal state
  const [selectedRateUser, setSelectedRateUser] = useState<AdminUser | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [customRate, setCustomRate] = useState<string>('1.0');
  const [submittingRate, setSubmittingRate] = useState(false);

  // Tenant Details Editor state
  const [selectedEditUser, setSelectedEditUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAccountType, setEditAccountType] = useState<'business' | 'reseller'>('business');
  const [editPlan, setEditPlan] = useState<'starter' | 'growth' | 'enterprise'>('starter');
  const [submittingEditUser, setSubmittingEditUser] = useState(false);

  // Gateway Modal state
  const [selectedGateway, setSelectedGateway] = useState<SmsGatewayConfig | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gwName, setGwName] = useState('');
  const [gwUrl, setGwUrl] = useState('');
  const [gwKey, setGwKey] = useState('');
  const [gwWeight, setGwWeight] = useState(50);
  const [gwActive, setGwActive] = useState(true);
  const [submittingGateway, setSubmittingGateway] = useState(false);

  // Sender ID Reject state
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const resp = await api.get('/admin/events');
      setEvents(resp.data);
    } catch { /* noop */ }
    finally { setLoadingEvents(false); }
  }, []);

  // Fetch admin statistics
  const fetchStats = useCallback(async () => {
    try {
      const resp = await api.get('/admin/stats');
      setStats(resp.data);
      fetchEvents();
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [fetchEvents]);

  // Fetch registered users list
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const resp = await api.get('/admin/users', {
        params: {
          page,
          limit,
          ...(debouncedSearch ? { search: debouncedSearch } : {})
        }
      });
      setUsers(resp.data);
    } catch { /* noop */ }
    finally { setLoadingUsers(false); }
  }, [page, limit, debouncedSearch]);

  // Fetch gateways list
  const fetchGateways = useCallback(async () => {
    setLoadingGateways(true);
    try {
      const resp = await api.get('/admin/gateways');
      setGateways(resp.data);
    } catch { /* noop */ }
    finally { setLoadingGateways(false); }
  }, []);

  const fetchSenderIds = useCallback(async () => {
    setLoadingSenderIds(true);
    try {
      const resp = await api.get('/admin/sender-ids');
      setSenderIds(resp.data);
    } catch { /* noop */ }
    finally { setLoadingSenderIds(false); }
  }, []);

  const fetchAdvantaSenderIds = useCallback(async () => {
    setLoadingAdvanta(true);
    try {
      const resp_adv = await api.get('/admin/sender-ids/advanta');
      setAdvantaSenderIds(resp_adv.data);
    } catch { /* noop */ }
    finally { setLoadingAdvanta(false); }
  }, []);

  const fetchAllUsersForSelect = useCallback(async () => {
    try {
      const resp = await api.get('/admin/users', { params: { limit: 100 } });
      setAllUsersForSelect(resp.data);
    } catch { /* noop */ }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const resp = await api.get('/admin/campaigns');
      setCampaigns(resp.data);
    } catch { /* noop */ }
    finally { setLoadingCampaigns(false); }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const resp = await api.get('/admin/transactions');
      setTransactions(resp.data);
    } catch { /* noop */ }
    finally { setLoadingTransactions(false); }
  }, []);

  const handleApproveSenderId = async (id: string) => {
    if (!confirm('Are you sure you want to approve this Sender ID request?')) return;
    try {
      await api.post(`/admin/sender-ids/${id}/approve`);
      await fetchSenderIds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve Sender ID request.');
    }
  };

  const handleRejectSenderIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest || !rejectReason.trim()) return;
    try {
      await api.post(`/admin/sender-ids/${rejectingRequest.id}/reject`, {
        reason: rejectReason.trim()
      });
      setRejectingRequest(null);
      setRejectReason('');
      await fetchSenderIds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject Sender ID request.');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time automatic stats update polling (every 8 seconds when dashboard is active)
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const interval = setInterval(() => {
      fetchStats();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'gateways') {
      fetchGateways();
    } else if (activeTab === 'sender_ids') {
      fetchSenderIds();
      fetchAdvantaSenderIds();
      fetchAllUsersForSelect();
    } else if (activeTab === 'campaigns') {
      fetchCampaigns();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, fetchUsers, fetchGateways, fetchSenderIds, fetchCampaigns, fetchTransactions, fetchAdvantaSenderIds, fetchAllUsersForSelect]);

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

  const openEditProfileModal = (u: AdminUser) => {
    setSelectedEditUser(u);
    setEditFullName(u.full_name);
    setEditUserEmail(u.email);
    setEditUserPhone(u.phone || '');
    setEditCompany(u.company || '');
    setEditAccountType(u.account_type);
    setEditPlan(u.plan);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser) return;
    setSubmittingEditUser(true);
    try {
      await api.put(`/admin/users/${selectedEditUser.id}`, {
        full_name: editFullName.trim(),
        email: editUserEmail.trim(),
        phone: editUserPhone.trim() || null,
        company: editCompany.trim() || null,
        account_type: editAccountType,
        plan: editPlan
      });
      setSelectedEditUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update tenant profile details.');
    } finally {
      setSubmittingEditUser(false);
    }
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

  // Update Gateway Weight directly from Dashboard Card
  const handleUpdateGatewayWeight = async (gateway: SmsGatewayConfig, newWeight: number) => {
    try {
      await api.post('/admin/gateways', {
        name: gateway.name,
        api_url: gateway.api_url,
        api_key: gateway.api_key,
        weight: newWeight,
        is_active: gateway.is_active
      }, {
        params: { gateway_id: gateway.id }
      });
      await fetchStats();
      await fetchGateways();
    } catch {
      alert("Failed to save gateway weight.");
      await fetchGateways();
    }
  };

  // Assign Approved Carrier Sender ID to Client
  const handleAssignSenderId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignUserId || !selectedAssignSenderId) return;
    setSubmittingAssignment(true);
    try {
      await api.post('/admin/sender-ids/assign', {
        user_id: selectedAssignUserId,
        sender_id: selectedAssignSenderId,
        purpose: assignPurpose.trim() || undefined
      });
      setIsAssignModalOpen(false);
      setSelectedAssignUserId('');
      setSelectedAssignSenderId('');
      setAssignPurpose('Assigned by Administrator');
      alert('Sender ID assigned successfully!');
      await fetchSenderIds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign Sender ID.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Add Sender ID to carrier pool
  const handleAddPoolSenderId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolSenderId.trim()) return;
    setSubmittingNewPoolId(true);
    try {
      await api.post('/admin/sender-ids/advanta', {
        sender_id: newPoolSenderId.trim()
      });
      setNewPoolSenderId('');
      alert('Sender ID added to Advanta pool successfully!');
      await fetchAdvantaSenderIds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add Sender ID.');
    } finally {
      setSubmittingNewPoolId(false);
    }
  };

  // Toggle carrier Sender ID active status
  const handleTogglePoolSenderId = async (id: string) => {
    try {
      await api.post(`/admin/sender-ids/advanta/${id}/toggle`);
      await fetchAdvantaSenderIds();
    } catch {
      alert('Failed to toggle status.');
    }
  };

  // Remove Sender ID from carrier pool
  const handleDeletePoolSenderId = async (id: string, senderId: string) => {
    if (!confirm(`Are you sure you want to remove '${senderId}' from the Advanta approved pool?`)) return;
    try {
      await api.delete(`/admin/sender-ids/advanta/${id}`);
      await fetchAdvantaSenderIds();
    } catch {
      alert('Failed to remove Sender ID.');
    }
  };

  // Pagination variables for Sender IDs
  const senderIdsPerPage = 10;
  const totalSenderIdPages = Math.ceil(senderIds.length / senderIdsPerPage);
  const displayedSenderIds = senderIds.slice(
    (senderIdPage - 1) * senderIdsPerPage,
    senderIdPage * senderIdsPerPage
  );

  return (
    <div className="min-h-screen flex overflow-hidden light-dashboard-bg dark:bg-surface-dark font-sans text-left w-full">
      {/* Sidebar Panel for Admin Console */}
      <aside className="w-64 h-screen clay-sidebar flex flex-col justify-between shrink-0 border-r border-slate-200/10 dark:border-white/5 bg-white dark:bg-slate-900 hidden md:flex">
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="px-1 py-1">
            <NavLink to="/">
              <TrackomLogo size={24} />
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'users', label: 'Tenant Users', icon: Users },
              { id: 'gateways', label: 'SMS Gateways', icon: Cpu },
              { id: 'sender_ids', label: 'Sender IDs', icon: Smartphone },
              { id: 'campaigns', label: 'All Campaigns', icon: Megaphone },
              { id: 'transactions', label: 'Transactions', icon: Coins },
              { id: 'settings', label: 'System Settings', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setPage(1); setClickedItem(item.id); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                    isSelected 
                      ? 'clay-nav-active text-brand-primary dark:text-brand-primary-light font-semibold' 
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-200/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <motion.div 
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isSelected 
                        ? 'bg-brand-primary/10 text-brand-primary dark:text-brand-primary-light' 
                        : 'clay-icon-raised text-slate-500'
                    }`}
                    animate={clickedItem === item.id ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.6, ease: "backOut" }}
                    onAnimationComplete={() => {
                      if (clickedItem === item.id) {
                        setClickedItem(null);
                      }
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/10 dark:border-white/5">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-slate-200/40 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold cursor-pointer transition-all bg-slate-200/20 dark:bg-white/5 hover:bg-slate-200/40 dark:hover:bg-white/10"
          >
            <span>← Back to Client App</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-h-screen custom-scrollbar bg-transparent">
        
        {/* Top Header Bar with user info */}
        <div className="flex items-center justify-between border-b border-slate-200/10 dark:border-white/5 pb-4 mb-2">
          {/* Mobile indicator / Left Title */}
          <div className="flex items-center gap-2 md:gap-0">
            <header className="flex md:hidden items-center gap-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl py-1 px-3 border border-slate-200/10 dark:border-white/5">
              <ShieldAlert className="w-4 h-4 text-brand-primary" />
            </header>
            <div className="text-left hidden md:block">
              <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white capitalize">{activeTab}</h1>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Platform overview & real-time analytics</p>
            </div>
            <div className="text-left md:hidden pl-2">
              <h1 className="text-lg font-display font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h1>
            </div>
          </div>

          {/* User profile details at the top right */}
          <div className="flex items-center gap-3 text-right">
            {activeTab === 'dashboard' && (
              <button
                onClick={() => { fetchStats(); fetchUsers(); fetchGateways(); }}
                className="border border-brand-primary/20 text-brand-primary hover:text-white bg-brand-primary/5 hover:bg-brand-primary/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Stats
              </button>
            )}
            <div className="h-8 w-px bg-slate-200/20 dark:bg-white/5 hidden sm:block" />
            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{user?.full_name || 'Admin User'}</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono leading-none mt-0.5">{user?.email || 'admin@trackom.com'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-display font-bold text-xs">
                {(user?.full_name || 'A')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* If dashboard tab is active, show the 5 detailed Trackom widgets */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards 5-Column Layout */}
            {loading ? (
              <div className="flex justify-center py-12"><Loader size="md" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                
                {/* CARD 1: TOTAL CLIENTS */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-brand-primary">
                        <Users className="w-5 h-5 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Total Clients</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">{stats?.total_users || 0}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">
                      ACTIVE {stats?.active_users || 0}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full">
                      SUSPENDED {(stats?.total_users || 0) - (stats?.active_users || 0)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2.5 mt-2.5 flex justify-between text-[9px] text-slate-500 font-mono">
                    <div>TODAY <span className="text-brand-primary font-bold">+{stats?.today_users || 0}</span></div>
                    <div>YEST <span className="text-brand-primary font-bold">+{stats?.yesterday_users || 0}</span></div>
                    <div>7D <span className="text-brand-primary font-bold">+{stats?.last_7d_users || 0}</span></div>
                  </div>
                </div>

                {/* CARD 2: MASTER GATEWAY POOL */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-brand-accent">
                        <Cpu className="w-5 h-5 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Master Gateway Pool</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none truncate">{stats?.system_balance?.toLocaleString() || 0}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-2xl text-[9px] text-slate-500 mt-2 font-mono">
                    Remaining credits at AdvantaSMS
                  </div>
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2.5 mt-2.5 flex justify-between text-[9px] text-slate-500 font-mono">
                    <div>PROVIDER <span className="text-brand-accent font-bold">AdvantaSMS</span></div>
                    <div>ENV <span className="text-brand-emerald font-bold">Live</span></div>
                  </div>
                </div>

                {/* CARD 3: CLIENT CREDITS OUT */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-amber-500">
                        <Coins className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Outstanding Client Credits</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none truncate">{stats?.total_client_credits?.toLocaleString() || 0}</div>
                  </div>
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2.5 mt-2.5 flex justify-between text-[9px] text-slate-500 font-mono">
                    <div>POOL LIQUIDITY <span className="text-amber-500 font-bold">{(stats && stats.system_balance > 0 ? (stats.system_balance / Math.max(stats.total_client_credits, 1) * 100).toFixed(1) : 0)}%</span></div>
                  </div>
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2 mt-2 text-[9px] text-slate-500 space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar font-mono">
                    {stats?.client_distributions?.slice(0, 5).map((c, idx) => (
                      <div key={idx} className="flex justify-between gap-2">
                        <span className="truncate max-w-[120px]">{c.client_name}</span>
                        <span className="font-bold text-slate-600 dark:text-gray-400">{c.sms_balance.toLocaleString()} credits</span>
                      </div>
                    ))}
                  </div>
                  {stats && stats.client_distributions && stats.client_distributions.length > 5 && (
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full text-center text-[8px] font-black uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors mt-1 pt-1 border-t border-slate-200/10 dark:border-white/5 bg-transparent border-0 cursor-pointer"
                    >
                      Show More Users →
                    </button>
                  )}
                </div>

                {/* CARD 4: ONLINE USERS */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-brand-emerald">
                        <UserCheck className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Online Users</div>
                    </div>
                    {stats && stats.online_users > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded-full font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-ping" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">{stats?.online_users || 0}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-emerald/10 text-brand-emerald rounded-full">
                      ACTIVE {stats?.active_users || 0}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full">
                      TOTAL {stats?.total_users || 0}
                    </span>
                  </div>
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2.5 mt-2.5 flex justify-between text-[9px] text-slate-500 font-mono">
                    <div>TODAY <span className="text-brand-primary font-bold">+{stats?.today_users || 0}</span></div>
                    <div>YEST <span className="text-brand-primary font-bold">+{stats?.yesterday_users || 0}</span></div>
                    <div>7D <span className="text-brand-primary font-bold">+{stats?.last_7d_users || 0}</span></div>
                  </div>
                </div>

                {/* CARD 5: GATEWAYS & ROUTING */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-cyan-500">
                          <Activity className="w-5 h-5 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">SMS Gateways</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${gateways.some(g => g.is_active) ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                        {gateways.filter(g => g.is_active).length}/{gateways.length} ONLINE
                      </span>
                    </div>

                    <div className="pt-1.5 flex items-baseline gap-2">
                      <div className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">
                        {gateways.length}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500">Whitelisted Nodes</span>
                    </div>

                    {/* Quick Load Balancer Sliders */}
                    <div className="space-y-2 mt-3 pt-2.5 border-t border-slate-200/20 dark:border-white/5">
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                        Quick Load Split Weights
                      </span>
                      {gateways.length > 0 ? (
                        <div className="space-y-2 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
                          {gateways.map(gw => (
                            <div key={gw.id} className="space-y-0.5">
                              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 dark:text-gray-300">
                                <span className="truncate max-w-[100px]">{gw.name}</span>
                                <span className="font-mono text-brand-primary font-bold">{gw.weight}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={gw.weight} 
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setGateways(prev => prev.map(g => g.id === gw.id ? { ...g, weight: val } : g));
                                }}
                                onMouseUp={() => handleUpdateGatewayWeight(gw, gw.weight)}
                                onTouchEnd={() => handleUpdateGatewayWeight(gw, gw.weight)}
                                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary" 
                                disabled={!gw.is_active}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block py-1">No active gateways</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2 mt-3 flex justify-between text-[9px] text-slate-500 font-mono">
                    <div>SAF <span className="text-brand-emerald font-bold">142ms</span></div>
                    <div>AIR <span className="text-brand-emerald font-bold">178ms</span></div>
                  </div>
                </div>

                {/* CARD 6: ALL TIME REVENUE */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-emerald-500">
                        <TrendingUp className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">All Time Revenue</div>
                    </div>
                    <span className="text-[9px] text-amber-400 font-bold font-mono">
                      KES {(() => { const v = stats?.this_year_revenue || 0; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()} this yr
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none truncate">
                      KES {(() => { const v = stats?.all_time_revenue || 0; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()}
                    </div>
                  </div>
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2 mt-3 text-[9px] text-slate-600 dark:text-slate-300 space-y-1.5 font-mono">
                    <div className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-0.5">Previous Months</div>
                    {/* Current month first */}
                    {stats?.monthly_revenue !== undefined && (
                      <div className="flex justify-between items-center">
                        <span>This Month</span>
                        <span className="font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[9px]">
                          KES {(() => { const v = stats?.monthly_revenue || 0; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()}
                        </span>
                      </div>
                    )}
                    {stats?.monthly_breakdown?.slice(0, 5).map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{b.month}</span>
                        <span className="font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[9px]">
                          KES {(() => { const v = b.revenue; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {stats && stats.monthly_breakdown && stats.monthly_breakdown.length > 5 && (
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="w-full text-center text-[8px] font-black uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors mt-1 py-1 bg-transparent border-0 cursor-pointer"
                    >
                      Show More →
                    </button>
                  )}
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2 mt-2 flex justify-between text-[9px] text-slate-600 dark:text-slate-300 font-mono">
                    <span>Paying Clients</span>
                    <span className="text-indigo-500 font-bold">{stats?.paying_clients || 0}</span>
                  </div>
                </div>

                {/* CARD 7: MONTHLY REVENUE */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-emerald-500">
                        <Coins className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Monthly Revenue</div>
                    </div>
                    <span className="text-[9px] text-brand-emerald font-bold font-mono">
                      ↗ KES {(() => { const v = stats?.today_revenue || 0; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()} today
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none truncate">
                      KES {(() => { const v = stats?.monthly_revenue || 0; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()}
                    </div>
                  </div>

                  {/* Daily revenue breakdown */}
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2 mt-3 text-[9px] text-slate-600 dark:text-slate-300 space-y-1.5 font-mono">
                    <div className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-0.5">Last 30 Days</div>
                    {stats?.daily_revenue_breakdown?.slice().reverse().slice(0, 5).map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{d.label}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${d.revenue > 0 ? 'text-brand-emerald bg-brand-emerald/10' : 'text-slate-500 dark:text-slate-400'}`}>
                          KES {(() => { const v = d.revenue; return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString(); })()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {stats && stats.daily_revenue_breakdown && stats.daily_revenue_breakdown.length > 5 && (
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="w-full text-center text-[8px] font-black uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors mt-1 py-1 bg-transparent border-0 cursor-pointer"
                    >
                      Show More →
                    </button>
                  )}
                </div>

                {/* CARD 8: SMS DISPATCH ANALYTICS */}
                <div className="clay-stat rounded-3xl p-5 flex flex-col justify-between min-h-[180px] text-left">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl clay-icon-raised flex items-center justify-center shrink-0 text-teal-500">
                          <Send className="w-5 h-5 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">SMS Delivery Rate</div>
                      </div>
                      <span className="text-[9px] text-brand-emerald font-bold font-mono bg-brand-emerald/10 px-2 py-0.5 rounded-full">
                        ↑ {(stats?.total_sms_sent || 0).toLocaleString()} total
                      </span>
                    </div>

                    <div className="pt-1.5 flex items-baseline gap-2">
                      <div className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">
                        {stats?.success_rate ?? 100.0}%
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500">Success Rate</span>
                    </div>

                    {/* Delivery Visual Progress Bar */}
                    {(() => {
                      const total = stats?.total_sms_sent || 0;
                      if (total === 0) {
                        return (
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full" />
                        );
                      }
                      const deliveredPct = ((stats?.delivered_sms_count || 0) / total) * 100;
                      const failedPct = ((stats?.failed_sms_count || 0) / total) * 100;
                      const pendingPct = ((stats?.pending_sms_count || 0) / total) * 100;
                      return (
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                          {deliveredPct > 0 && (
                            <div 
                              className="bg-brand-emerald h-full transition-all duration-500" 
                              style={{ width: `${deliveredPct}%` }} 
                              title={`Delivered: ${deliveredPct.toFixed(1)}%`}
                            />
                          )}
                          {failedPct > 0 && (
                            <div 
                              className="bg-rose-500 h-full transition-all duration-500" 
                              style={{ width: `${failedPct}%` }} 
                              title={`Failed: ${failedPct.toFixed(1)}%`}
                            />
                          )}
                          {pendingPct > 0 && (
                            <div 
                              className="bg-amber-500 h-full transition-all duration-500" 
                              style={{ width: `${pendingPct}%` }} 
                              title={`Pending: ${pendingPct.toFixed(1)}%`}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 2x2 grid for sub-stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/20 dark:border-white/5">
                    <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/10 dark:border-white/[0.03] text-left">
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Delivered</span>
                      <span className="text-xs font-bold text-brand-emerald font-mono">
                        {(stats?.delivered_sms_count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/10 dark:border-white/[0.03] text-left">
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Failed</span>
                      <span className="text-xs font-bold text-rose-500 font-mono">
                        {(stats?.failed_sms_count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/10 dark:border-white/[0.03] text-left">
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Pending</span>
                      <span className="text-xs font-bold text-amber-500 font-mono">
                        {(stats?.pending_sms_count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/10 dark:border-white/[0.03] text-left">
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Void</span>
                      <span className="text-xs font-bold text-slate-500 font-mono">0</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Analytics Charts & Live Monitor Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* SMS Volume Area Chart */}
              <div className="clay-card rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brand-emerald" /> Platform SMS Volume (Daily)
                  </span>
                  <span className="text-[10px] text-brand-emerald font-bold bg-brand-emerald/10 px-2 py-0.5 rounded-full">+24% vs last week</span>
                </div>
                <div className="relative h-44 w-full">
                  {(() => {
                    const volumes = stats?.daily_volumes || [];
                    const maxVal = Math.max(...volumes.map(v => v.volume), 10);
                    
                    // Map to coordinates: x is 30 to 280, y is 110 to 30
                    const points = volumes.map((v, i) => {
                      const x = 30 + (i * (250 / 6));
                      const y = 110 - (v.volume / maxVal * 80);
                      return { x, y, label: v.label, volume: v.volume };
                    });
                    
                    // Path d attributes
                    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaD = pathD ? `${pathD} L 280 110 L 30 110 Z` : '';
                    
                    return (
                      <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
                            <stop offset="100%" stopColor="rgba(99,102,241,0.0)" />
                          </linearGradient>
                        </defs>
                        <line x1="30" y1="20" x2="280" y2="20" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3" />
                        <line x1="30" y1="50" x2="280" y2="50" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3" />
                        <line x1="30" y1="80" x2="280" y2="80" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3" />
                        <line x1="30" y1="110" x2="280" y2="110" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3" />

                        {areaD && <path d={areaD} fill="url(#areaGrad)" />}
                        {pathD && <path d={pathD} fill="none" stroke="rgb(99,102,241)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="rgb(99,102,241)" stroke="white" strokeWidth="1" />
                            <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#6366f1" fontSize="7" fontWeight="bold">{p.volume}</text>
                            <text x={p.x} y="125" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">{p.label}</text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Top Clients by Balance */}
              <div className="clay-card rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-primary" /> Top Clients by Balance
                  </span>
                  <span className="text-[10px] text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    Rate: {baseSmsCost.toFixed(2)}/SMS
                  </span>
                </div>
                <div className="h-44 flex flex-col justify-between">
                  <div className="flex-1 space-y-3 flex flex-col justify-start">
                    {stats?.client_distributions && stats.client_distributions.length > 0 ? (
                      (() => {
                        const itemsPerPage = 3;
                        const displayedClients = stats.client_distributions.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage);
                        return displayedClients.map((client, idx) => {
                          const totalCredits = stats.total_client_credits || 1;
                          const sharePct = (client.sms_balance / totalCredits) * 100;
                          return (
                            <div key={idx} className="space-y-0.5 text-left">
                              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300">
                                <span className="truncate max-w-[150px]">{client.client_name}</span>
                                <span className="font-mono text-brand-primary font-bold">
                                  {client.sms_balance.toLocaleString()} cr ({sharePct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-brand-primary transition-all duration-500" 
                                  style={{ width: `${sharePct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="text-center text-xs text-slate-400 italic py-6 my-auto">
                        No client accounts registered to show distributions.
                      </div>
                    )}
                  </div>

                  {/* Pagination Footer */}
                  {(() => {
                    const totalClients = stats?.client_distributions?.length || 0;
                    const itemsPerPage = 3;
                    const totalPages = Math.ceil(totalClients / itemsPerPage);
                    if (totalPages <= 1) return null;
                    return (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-gray-500 pt-2 border-t border-slate-200/20 dark:border-white/5 shrink-0">
                        <span>Page {clientPage} of {totalPages}</span>
                        <div className="flex gap-1">
                          <button 
                            disabled={clientPage === 1}
                            onClick={() => setClientPage(p => Math.max(1, p - 1))}
                            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            disabled={clientPage === totalPages}
                            onClick={() => setClientPage(p => Math.min(totalPages, p + 1))}
                            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Live Events Feed */}
              <div className="clay-card rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-brand-accent" /> SaaS Live Events
                  </span>
                  <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                </div>
                <div className="h-44 overflow-y-auto space-y-3 custom-scrollbar text-left pr-1">
                  {(showAllEvents ? events : events.slice(0, 5)).length > 0 ? (
                    (showAllEvents ? events : events.slice(0, 5)).map(ev => {
                      const timeStr = new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date(ev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                      const borderCol = ev.type === 'signup' 
                        ? 'border-brand-primary' 
                        : ev.type === 'sender_id' 
                        ? 'border-brand-emerald' 
                        : 'border-amber-500';
                      return (
                        <div key={ev.id} className={`text-[11px] leading-tight text-slate-500 dark:text-gray-400 border-l-2 ${borderCol} pl-3 py-0.5`}>
                          <div className="font-semibold text-slate-700 dark:text-white">{ev.title}</div>
                          <div>{ev.description}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{timeStr}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-xs text-slate-400 italic py-12">
                      {loadingEvents ? <Loader size="sm" /> : 'No platform events logged.'}
                    </div>
                  )}
                </div>
                {events.length > 5 && (
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="w-full text-center text-[8px] font-black uppercase tracking-wider text-brand-accent hover:text-brand-accent/80 transition-colors mt-2 pt-2 border-t border-slate-200/10 dark:border-white/5 bg-transparent border-0 cursor-pointer"
                  >
                    {showAllEvents ? 'Show Less' : 'Show More Events →'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="clay-input w-full pl-11 pr-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
              placeholder="Search tenant emails, names, or companies..." 
            />
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="text-center py-12"><Loader size="md" /></div>
          ) : (
            <div className="clay-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Tenant</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">SMS Rate</th>
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
                                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' 
                                : 'bg-brand-primary/20 text-brand-primary'
                            }`}>
                              {u.is_superuser ? 'AD' : u.full_name.slice(0,2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{u.full_name}</span>
                                {u.is_superuser && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono uppercase">Admin</span>
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10 font-mono">
                              KES {u.credit_rate.toFixed(2)}/SMS
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
                            {/* Edit Profile Details Button */}
                            <button
                              onClick={() => openEditProfileModal(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-all"
                              title="Edit tenant details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

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
              
              {/* Pagination controls */}
              {users.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-200/20 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <button 
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-600 dark:text-gray-400">Page {page}</span>
                  <button 
                    type="button"
                    onClick={() => setPage(p => p + 1)}
                    disabled={users.length < limit}
                    className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
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
            <div className="text-center py-12"><Loader size="md" /></div>
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
          <GenieModal onClose={() => setIsCreditModalOpen(false)} className="p-6">
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
                {submittingCredits ? <Loader size="sm" /> : <span>Apply Credit Adjustment</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* SMS Rate Modal */}
      <AnimatePresence>
        {isRateModalOpen && selectedRateUser && (
          <GenieModal onClose={() => setIsRateModalOpen(false)} className="p-6">
            <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Sliders className="w-5 h-5 text-amber-500" /><span>Set Account SMS Rate</span></h3>
              <button onClick={() => setIsRateModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="clay-inset rounded-2xl p-3 mb-4 text-xs space-y-1">
              <div>User: <span className="font-bold text-slate-900 dark:text-white">{selectedRateUser.full_name}</span></div>
              <div>Email: <span className="font-mono text-slate-500 dark:text-gray-400">{selectedRateUser.email}</span></div>
              <div>Current Rate: <span className="font-bold text-amber-500 font-mono">KES {selectedRateUser.credit_rate.toFixed(2)}/SMS</span></div>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Custom SMS Rate (KES per SMS)</label>
                <input type="number" step="0.01" min="0.01" value={customRate} onChange={e => setCustomRate(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" required />
                <p className="text-[10px] text-slate-400">Set the custom rate that this user pays in KES per SMS credit (e.g. 0.80 KES/SMS). Default rate is 1.00 KES/SMS.</p>
              </div>
              <button type="submit" disabled={submittingRate || !customRate} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                {submittingRate ? <Loader size="sm" /> : <span>Update Custom Rate</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Edit Tenant Profile Modal */}
      <AnimatePresence>
        {selectedEditUser && (
          <GenieModal onClose={() => setSelectedEditUser(null)} className="p-6 max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-primary" />
                <span>Edit Tenant Details</span>
              </h3>
              <button onClick={() => setSelectedEditUser(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Full Name *</label>
                <input 
                  type="text" 
                  value={editFullName} 
                  onChange={e => setEditFullName(e.target.value)} 
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Email Address *</label>
                <input 
                  type="email" 
                  value={editUserEmail} 
                  onChange={e => setEditUserEmail(e.target.value)} 
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Phone Number</label>
                <input 
                  type="tel" 
                  value={editUserPhone} 
                  onChange={e => setEditUserPhone(e.target.value)} 
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                  placeholder="e.g. +254700000000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Company Name</label>
                <input 
                  type="text" 
                  value={editCompany} 
                  onChange={e => setEditCompany(e.target.value)} 
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Account Type</label>
                  <select 
                    value={editAccountType} 
                    onChange={e => setEditAccountType(e.target.value as any)} 
                    className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="business">Business</option>
                    <option value="reseller">Reseller</option>
                  </select>
                </div>

              </div>

              <button type="submit" disabled={submittingEditUser} className="clay-button-primary w-full py-3 mt-2 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                {submittingEditUser ? <Loader size="sm" /> : <span>Save Tenant Changes</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Gateway API Configuration Modal */}
      <AnimatePresence>
        {isGatewayModalOpen && (
          <GenieModal onClose={() => setIsGatewayModalOpen(false)} className="p-6">
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
                {submittingGateway ? <Loader size="sm" /> : <span>Save API Gateway</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Assign Sender ID Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <GenieModal onClose={() => setIsAssignModalOpen(false)} className="p-6 max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand-primary" />
                <span>Assign Sender ID to Client</span>
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAssignSenderId} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Select Client / Tenant *</label>
                <select 
                  value={selectedAssignUserId}
                  onChange={e => setSelectedAssignUserId(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Choose a Client --</option>
                  {allUsersForSelect.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Select Approved Advanta Sender ID *</label>
                <select 
                  value={selectedAssignSenderId}
                  onChange={e => setSelectedAssignSenderId(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Choose a Sender ID --</option>
                  {advantaSenderIds.map(item => (
                    <option key={item.id} value={item.sender_id}>
                      {item.sender_id} ({item.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Allocation Purpose / Notes</label>
                <input 
                  type="text" 
                  value={assignPurpose} 
                  onChange={e => setAssignPurpose(e.target.value)} 
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none"
                  placeholder="e.g. Assigned by Administrator"
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingAssignment || !selectedAssignUserId || !selectedAssignSenderId} 
                className="clay-button-primary w-full py-3 mt-2 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {submittingAssignment ? <Loader size="sm" /> : <span>Assign Sender ID</span>}
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>

      {activeTab === 'sender_ids' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-primary" />
              <span>Sender ID Manager & Whitelist</span>
            </h3>
            <button
              onClick={() => {
                setIsAssignModalOpen(true);
                if (allUsersForSelect.length > 0) setSelectedAssignUserId(allUsersForSelect[0].id);
                if (advantaSenderIds.length > 0) setSelectedAssignSenderId(advantaSenderIds[0].sender_id);
              }}
              className="clay-button-primary flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Sender ID to Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1 & 2: Client whitelisting requests */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider pl-1 text-left">Client Requests Registry</h4>
              {loadingSenderIds ? (
                <div className="text-center py-12 clay-card rounded-3xl"><Loader size="md" /></div>
              ) : (
                <div className="clay-card rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto font-sans">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                          <th className="px-2 py-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Client</th>
                          <th className="px-2 py-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Requested ID</th>
                          <th className="px-2 py-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Purpose</th>
                          <th className="px-2 py-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Status</th>
                          <th className="px-2 py-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Date</th>
                          <th className="px-2 py-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedSenderIds.map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="px-2 py-2 text-xs text-slate-900 dark:text-white max-w-[120px] truncate">
                              <div className="font-semibold truncate">{r.user_name}</div>
                              <div className="text-[9px] text-slate-400 dark:text-gray-500 font-mono mt-0.5 truncate">{r.user_email}</div>
                            </td>
                            <td className="px-2 py-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white font-mono font-bold text-[10px] uppercase">
                                {r.sender_id}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-[11px] text-slate-600 dark:text-gray-300 max-w-[100px] truncate" title={r.purpose}>
                              {r.purpose}
                            </td>
                            <td className="px-2 py-2">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                r.status === 'approved' 
                                  ? 'bg-brand-emerald/10 text-brand-emerald' 
                                  : r.status === 'rejected' 
                                  ? 'bg-red-500/10 text-red-500' 
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                              {r.status === 'rejected' && r.rejection_reason && (
                                <div className="text-[9px] text-red-500 mt-0.5 max-w-[100px] truncate">Reason: {r.rejection_reason}</div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                              {new Date(r.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {r.status === 'pending' ? (
                                <div className="inline-flex gap-1">
                                  <button
                                    onClick={() => handleApproveSenderId(r.id)}
                                    className="p-1 text-white bg-brand-emerald hover:bg-brand-emerald-dark rounded-lg cursor-pointer transition-all flex items-center justify-center"
                                    title="Approve Request"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setRejectingRequest(r); setRejectReason(''); }}
                                    className="p-1 text-white bg-rose-500 hover:bg-rose-600 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                                    title="Reject Request"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Audited</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {senderIds.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-16">
                              <Smartphone className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                              <p className="text-sm text-slate-500 dark:text-gray-400">No Sender ID whitelisting requests submitted yet.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalSenderIdPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/[0.03]">
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        Showing {(senderIdPage - 1) * senderIdsPerPage + 1} to {Math.min(senderIdPage * senderIdsPerPage, senderIds.length)} of {senderIds.length} requests
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSenderIdPage(prev => Math.max(prev - 1, 1))}
                          disabled={senderIdPage === 1}
                          className="p-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
                          Page {senderIdPage} of {totalSenderIdPages}
                        </span>
                        <button
                          onClick={() => setSenderIdPage(prev => Math.min(prev + 1, totalSenderIdPages))}
                          disabled={senderIdPage === totalSenderIdPages}
                          className="p-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 3: Advanta Approved Sender IDs Pool */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider pl-1 text-left">Advanta Approved Pool</h4>
              {loadingAdvanta ? (
                <div className="text-center py-12 clay-card rounded-3xl"><Loader size="sm" /></div>
              ) : (
                <div className="clay-card rounded-3xl p-5 space-y-4">
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed text-left">
                    Manage carrier-approved Sender IDs. Click a status badge to toggle active status or delete/add entries.
                  </p>
                  
                  {/* Inline Form to Add Approved ID */}
                  <form onSubmit={handleAddPoolSenderId} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="NEW SENDER ID" 
                      value={newPoolSenderId}
                      onChange={e => setNewPoolSenderId(e.target.value.toUpperCase())}
                      className="clay-input flex-1 px-3 py-2 rounded-2xl text-xs font-mono font-bold uppercase focus:outline-none"
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={submittingNewPoolId || !newPoolSenderId.trim()}
                      className="p-2 bg-brand-primary text-white hover:bg-brand-primary/95 rounded-2xl cursor-pointer transition-all flex items-center justify-center disabled:opacity-50"
                      title="Add to Pool"
                    >
                      {submittingNewPoolId ? <Loader size="xs" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                  
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar text-left font-sans">
                    {advantaSenderIds.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/10 dark:border-white/[0.03]"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-brand-emerald animate-pulse' : 'bg-red-500'}`} />
                          <span className="font-mono font-bold text-sm text-slate-800 dark:text-white uppercase">{item.sender_id}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePoolSenderId(item.id)}
                            className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-all ${
                              item.status === 'active' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'
                            }`}
                            title="Click to toggle status"
                          >
                            {item.status}
                          </button>
                          
                          <button
                            onClick={() => handleDeletePoolSenderId(item.id, item.sender_id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                            title="Remove from pool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {advantaSenderIds.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400 italic">No approved Advanta IDs loaded.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand-primary" />
              <span>SaaS Campaign Monitoring Logs</span>
            </h3>
          </div>

          {loadingCampaigns ? (
            <div className="text-center py-12"><Loader size="md" /></div>
          ) : (
            <div className="clay-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Client</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Campaign</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Sender ID</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Recipients</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Success Rate</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const successRate = c.total_recipients > 0 ? Math.round((c.sent_count / c.total_recipients) * 100) : 0;
                      return (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="px-5 py-3 text-sm text-slate-900 dark:text-white">
                            <div className="font-semibold">{c.user_name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">{c.user_email}</div>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-900 dark:text-white font-medium">
                            {c.name}
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 font-mono font-bold text-xs uppercase">
                              {c.sender_id}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              c.status === 'completed' 
                                ? 'bg-brand-emerald/10 text-brand-emerald' 
                                : c.status === 'sending' 
                                ? 'bg-brand-primary/10 text-brand-primary' 
                                : c.status === 'paused' 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold font-mono text-slate-800 dark:text-white">
                            {c.total_recipients}
                          </td>
                          <td className="px-5 py-3 text-sm">
                            <div className="font-bold text-slate-800 dark:text-white font-mono">{successRate}%</div>
                            <div className="text-[10px] text-slate-400 font-mono">{c.sent_count} sent, {c.failed_count} failed</div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 dark:text-gray-400 font-mono">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <Megaphone className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 dark:text-gray-400">No campaigns launched across the system yet.</p>
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

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-brand-primary" />
              <span>SaaS Transaction Ledger</span>
            </h3>
          </div>

          {loadingTransactions ? (
            <div className="text-center py-12"><Loader size="md" /></div>
          ) : (
            <div className="clay-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Client</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Type</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Reference</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Amount</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">SMS Credits</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Description</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-900 dark:text-white">
                          <div className="font-semibold">{t.user_name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">{t.user_email}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.type === 'deposit' 
                              ? 'bg-brand-emerald/10 text-brand-emerald' 
                              : t.type === 'bonus' 
                              ? 'bg-purple-500/10 text-purple-500' 
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-gray-400 font-mono">
                          {t.reference}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-slate-800 dark:text-white font-mono">
                          {t.amount > 0 ? `KES ${t.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className={`px-5 py-3 text-sm font-bold font-mono ${t.sms_credits >= 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                          {t.sms_credits >= 0 ? `+${t.sms_credits.toLocaleString()}` : t.sms_credits.toLocaleString()} cr
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-gray-400 max-w-xs truncate" title={t.description}>
                          {t.description || '-'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-gray-400 font-mono">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <Coins className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 dark:text-gray-400">No transaction logs available yet.</p>
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

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-primary" />
                <span>System Platform Configurations</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Control pricing default parameters, MPESA API channels, and platform states.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* CARD 1: MPESA WALLET SETTINGS */}
              <div className="clay-card rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-200/20 dark:border-white/5 pb-2">
                  MPESA Gateway Settings
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">MPESA Paybill Number</label>
                    <input type="text" value={mpesaPaybill} onChange={e => setMpesaPaybill(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">MPESA Till / Buy Goods Number</label>
                    <input type="text" value={mpesaTill} onChange={e => setMpesaTill(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Minimum Deposit Limit (KES)</label>
                    <input type="number" value={minDeposit} onChange={e => setMinDeposit(Number(e.target.value))} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-2.5 pt-2">
                    <input type="checkbox" id="autoCreditCheck" checked={autoCredit} onChange={e => setAutoCredit(e.target.checked)} className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                    <label htmlFor="autoCreditCheck" className="text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">Auto-credit user wallets on payment verification</label>
                  </div>
                </div>
              </div>

              {/* CARD 2: DEFAULT TENANT RATES */}
              <div className="clay-card rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-200/20 dark:border-white/5 pb-2">
                  Portal Defaults & Registration Economics
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Base Cost per SMS Credit (KES)</label>
                    <input type="number" step="0.01" value={baseSmsCost} onChange={e => setBaseSmsCost(Number(e.target.value))} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Sender ID Registration Charge (KES)</label>
                    <input type="number" value={senderIdFee} onChange={e => setSenderIdFee(Number(e.target.value))} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">AdvantaSMS Default Sender ID / Shortcode</label>
                    <input type="text" value={advantasmsDefaultShortcode} onChange={e => setAdvantasmsDefaultShortcode(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* CARD 4: PLATFORM SUPPORT & BANNER */}
              <div className="clay-card rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-200/20 dark:border-white/5 pb-2">
                  Support Channels & Platform State
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Platform Support Email</label>
                    <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Platform Support Phone Number</label>
                    <input type="text" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Admin Broadcast / Alert Banner Message</label>
                    <textarea value={alertBanner} onChange={e => setAlertBanner(e.target.value)} placeholder="e.g. Scheduled gateway maintenance tonight at 12:00 AM EAT." rows={2} className="clay-input w-full px-4 py-2 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none resize-none" />
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <input type="checkbox" id="maintCheck" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                    <label htmlFor="maintCheck" className="text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">Activate global platform maintenance mode</label>
                  </div>
                </div>
              </div>

            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="clay-button-primary px-6 py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2"
              >
                {savingSettings ? <Loader size="sm" /> : <Save className="w-4 h-4" />}
                <span>Save System Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Sender ID Modal */}
      <AnimatePresence>
        {rejectingRequest && (
          <GenieModal onClose={() => setRejectingRequest(null)} className="p-6">
            <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                <span>Reject Sender ID Request</span>
              </h3>
              <button onClick={() => setRejectingRequest(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="clay-inset rounded-2xl p-3 mb-4 text-xs space-y-1">
              <div>Requested ID: <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">{rejectingRequest.sender_id}</span></div>
              <div>Client: <span className="font-bold text-slate-900 dark:text-white">{rejectingRequest.user_name}</span></div>
            </div>

            <form onSubmit={handleRejectSenderIdSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Rejection Reason</label>
                <textarea 
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                  placeholder="e.g. Please provide supporting registration documentation verifying your brand name." 
                  rows={4} 
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none resize-none" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={!rejectReason.trim()} 
                className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 border-rose-600"
              >
                Confirm Rejection
              </button>
            </form>
          </GenieModal>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
