/**
 * SettingsPage — profile, notifications, and plan settings.
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, User, Bell, Shield, CreditCard, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [webhookUrl, setWebhookUrl] = useState(user?.webhook_url || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true); setMsg(null);
    try {
      await api.put('/users/me', { full_name: fullName, phone, company, webhook_url: webhookUrl });
      await refreshUser();
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Update failed.' });
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-white/6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg cursor-pointer transition-all whitespace-nowrap ${tab === t.id ? 'text-brand-primary border-b-2 border-brand-primary -mb-px' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}<span>{msg.text}</span>
        </div>
      )}

      {tab === 'profile' && (
        <div className="clay-card rounded-3xl p-6 space-y-5">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" /></div>
            <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email</label><input type="email" value={user?.email || ''} disabled className="clay-inset w-full px-4 py-3 rounded-2xl text-slate-400 dark:text-gray-500 text-sm cursor-not-allowed" /></div>
            <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all" /></div>
            <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Company</label><input type="text" value={company} onChange={e => setCompany(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Webhook Callback URL (Developer)</label>
              <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.yourcompany.com/sms/callback" className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all" />
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">If set, we will POST real-time delivery status reports (DLR) to this endpoint for all SMS operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSaveProfile} disabled={saving} className="clay-button-primary flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-60">
              {saving ? <Loader size="sm" /> : <span>Save Changes</span>}
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="clay-card rounded-3xl p-6 space-y-5">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Change Password</h3>
          <div className="space-y-4 max-w-md">
            {['Current Password', 'New Password', 'Confirm Password'].map(l => (
              <div key={l} className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">{l}</label><input type="password" className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="••••••••" /></div>
            ))}
            <button className="clay-button-primary px-6 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all">Update Password</button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="clay-card rounded-3xl p-6 space-y-4">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Notification Preferences</h3>
          {['Campaign completion alerts', 'Low balance warnings', 'Weekly reports', 'API usage alerts', 'Security notifications'].map(n => (
            <label key={n} className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm text-slate-700 dark:text-gray-300">{n}</span>
              <div className="relative w-10 h-6 bg-brand-primary/20 rounded-full"><div className="absolute left-1 top-1 w-4 h-4 bg-brand-primary rounded-full transition-transform" /></div>
            </label>
          ))}
        </div>
      )}

      {tab === 'billing' && (
        <div className="clay-card rounded-3xl p-6 space-y-4">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Current Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Starter', price: 'Free', features: ['10K free credits', 'Basic support', '1 Sender ID'], current: user?.plan === 'starter' },
              { name: 'Growth', price: 'KES 2,999/mo', features: ['50K credits/mo', 'Priority support', '5 Sender IDs'], current: user?.plan === 'growth' },
              { name: 'Enterprise', price: 'Custom', features: ['Unlimited credits', 'Dedicated support', 'Custom Sender IDs'], current: user?.plan === 'enterprise' },
            ].map(p => (
              <div key={p.name} className={`clay-card clay-card-hover rounded-3xl p-5 space-y-3 transition-all ${p.current ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20' : ''}`}>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</div>
                <div className="text-lg font-bold text-brand-primary font-mono">{p.price}</div>
                <ul className="space-y-1">{p.features.map(f => <li key={f} className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-brand-emerald" />{f}</li>)}</ul>
                <button className={`clay-button-secondary w-full py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${p.current ? 'clay-nav-active text-brand-primary' : ''}`}>{p.current ? 'Current Plan' : 'Upgrade'}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
