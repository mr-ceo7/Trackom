/**
 * DashboardLayout - sidebar + topbar + main content area + notification drawer.
 */
import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Send, Users, Megaphone, BarChart3,
  Wallet, Key, Settings, LogOut, Menu, X, Bell, ChevronDown,
  MessageSquare, CheckCircle2, AlertCircle, Info, AlertTriangle, Shield, FileText, Inbox, Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import SandboxToggle from '../components/SandboxToggle';
import TrackomLogo from '../components/TrackomLogo';
import BottomNav from '../components/BottomNav';
import api from '../services/api';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/compose', icon: Send, label: 'Compose SMS' },
  { to: '/dashboard/inbox', icon: Inbox, label: 'Inbox' },
  { to: '/dashboard/contacts', icon: Users, label: 'Contacts' },
  { to: '/dashboard/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/dashboard/templates', icon: FileText, label: 'Templates' },
  { to: '/dashboard/sender-ids', icon: Smartphone, label: 'Sender IDs' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const typeIcons: Record<string, any> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  campaign: Megaphone,
  billing: Wallet,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-500 bg-blue-500/10',
  success: 'text-brand-emerald bg-brand-emerald/10',
  warning: 'text-amber-500 bg-amber-500/10',
  error: 'text-red-500 bg-red-500/10',
  campaign: 'text-purple-500 bg-purple-500/10',
  billing: 'text-brand-primary bg-brand-primary/10',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  
  const currentNavItems = [...navItems];
  if (user?.is_superuser) {
    currentNavItems.push({ to: '/admin', icon: Shield, label: 'Admin Control' });
  }
  if (user?.account_type === 'reseller') {
    currentNavItems.push({ to: '/dashboard/reseller', icon: Key, label: 'Reseller Panel' });
  }

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notiOpen, setNotiOpen] = useState(false);
  const [publicSettings, setPublicSettings] = useState<any>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const resp = await api.get('/notifications');
      setNotifications(resp.data);
    } catch { /* noop */ }
  }, []);

  const fetchPublicSettings = useCallback(async () => {
    try {
      const resp = await api.get('/admin/settings/public');
      setPublicSettings(resp.data);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchPublicSettings();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPublicSettings();
    }, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPublicSettings]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch { /* noop */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      await fetchNotifications();
    } catch { /* noop */ }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <div className="h-screen flex overflow-hidden light-dashboard-bg dark:bg-surface-dark">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 h-screen clay-sidebar shrink-0">
        <div className="px-6 py-5">
          <NavLink to="/"><TrackomLogo size={24} /></NavLink>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setClickedItem(item.to)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'clay-nav-active text-brand-primary dark:text-brand-primary-light font-semibold'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-200/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <motion.div 
                className="w-8 h-8 rounded-xl clay-icon-raised flex items-center justify-center shrink-0"
                animate={clickedItem === item.to ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.6, ease: "backOut" }}
                onAnimationComplete={() => {
                  if (clickedItem === item.to) {
                    setClickedItem(null);
                  }
                }}
              >
                <item.icon className="w-4 h-4 transition-all duration-200" />
              </motion.div>
              <span>{item.label}</span>
              {item.label === 'Compose SMS' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl clay-inset">
            <MessageSquare className="w-4 h-4 text-brand-primary" />
            <div className="flex-1">
              <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider font-semibold">SMS Balance</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {user?.sms_balance?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 bottom-0 w-72 clay-sidebar z-50 lg:hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/40 dark:border-white/6">
                <TrackomLogo size={24} />
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {currentNavItems.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} onClick={() => { setSidebarOpen(false); setClickedItem(item.to); }} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all group ${isActive ? 'clay-nav-active text-brand-primary font-semibold' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-200/40 dark:hover:bg-white/5'}`}>
                    <motion.div 
                      className="w-8 h-8 rounded-xl clay-icon-raised flex items-center justify-center shrink-0"
                      animate={clickedItem === item.to ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 0.6, ease: "backOut" }}
                      onAnimationComplete={() => {
                        if (clickedItem === item.to) {
                          setClickedItem(null);
                        }
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                    </motion.div>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 clay-topbar shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-2xl text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5 cursor-pointer transition-all">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white hidden sm:block">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <SandboxToggle />
            <ThemeToggle className="clay-button-secondary text-slate-500 dark:text-gray-400" />

            {/* Notifications */}
            <button onClick={() => setNotiOpen(true)} className="relative p-2 rounded-2xl text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white clay-button-secondary cursor-pointer transition-all">
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-2xl hover:bg-slate-200/40 dark:hover:bg-white/5 cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-xs font-bold clay-button-primary">{initials}</div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-2 w-56 rounded-2xl clay-card shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{user?.full_name}</div>
                      <div className="text-xs text-slate-400 dark:text-gray-500 truncate">{user?.email}</div>
                    </div>
                    <div className="p-1">
                      {user?.is_superuser && (
                        <NavLink to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 mb-1 pb-1.5">
                          <Shield className="w-4 h-4 text-brand-primary" /><span>Admin Panel</span>
                        </NavLink>
                      )}
                      <NavLink to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <Settings className="w-4 h-4" /><span>Settings</span>
                      </NavLink>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors">
                        <LogOut className="w-4 h-4" /><span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-y-auto min-h-0 space-y-4">
          {/* Admin Announcement Alert Banner */}
          {publicSettings?.alertBanner && (
            <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary dark:text-brand-primary-light px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm text-left">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              <span><strong>Announcement:</strong> {publicSettings.alertBanner}</span>
            </div>
          )}

          {/* Maintenance Mode Banner */}
          {publicSettings?.maintenanceMode && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm text-left">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span><strong>Notice:</strong> Platform is currently in scheduled maintenance. Outbound broadcasts might experience minor dispatch delays.</span>
            </div>
          )}

          <Outlet />
        </main>
      </div>

      {/* NOTIFICATION SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {notiOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setNotiOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 clay-sidebar dark:bg-surface-card z-50 flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand-primary" />
                  <h3 className="font-display font-bold text-slate-900 dark:text-white">Notifications</h3>
                </div>
                <button onClick={() => setNotiOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {unreadCount > 0 && (
                <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-gray-400 font-medium">{unreadCount} unread message(s)</span>
                  <button onClick={handleMarkAllRead} className="text-brand-primary hover:underline font-semibold cursor-pointer">Mark all as read</button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.03]">
                {notifications.map(n => {
                  const Icon = typeIcons[n.type] || Info;
                  const colorClass = typeColors[n.type] || 'text-slate-500 bg-slate-100';
                  return (
                    <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative ${!n.is_read ? 'bg-brand-primary/5' : ''}`}>
                      <div className="w-8 h-8 rounded-lg clay-icon-raised flex items-center justify-center shrink-0">
                        <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]} ${n.type === 'success' ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]' : n.type === 'error' ? 'drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]' : n.type === 'warning' ? 'drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]' : 'drop-shadow-[0_0_5px_rgba(59,130,246,0.4)]'}`} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="text-xs font-semibold text-slate-950 dark:text-white flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-normal">{n.message}</p>
                        <span className="text-[9px] text-slate-400 dark:text-gray-500 font-mono block">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="text-center py-20 text-slate-400 dark:text-gray-500 space-y-2">
                    <Bell className="w-8 h-8 mx-auto stroke-1" />
                    <p className="text-xs">No notifications yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION */}
      <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />
    </div>
  );
}
