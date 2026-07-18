/**
 * SettingsPage - profile, notifications, and plan settings.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, User, Bell, Shield, Eye, EyeOff, CheckCircle2, AlertCircle, Smartphone, MessageSquare, Mail, Send, AlertTriangle, BarChart2, Terminal, Lock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/Loader';
import { QRCodeSVG } from 'qrcode.react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const targetTab = searchParams.get('tab') || (location.hash === '#security' ? 'security' : 'profile');
    if (['profile', 'security', 'notifications'].includes(targetTab)) {
      setTab(targetTab);
    }
  }, [location]);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [webhookUrl, setWebhookUrl] = useState(user?.webhook_url || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // 2FA state
  const [totpCode, setTotpCode] = useState('');
  const [setupData, setSetupData] = useState<{ secret?: string; otpauth_url?: string; phone?: string; email?: string } | null>(null);
  const [loading2Fa, setLoading2Fa] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [disableCodeSent, setDisableCodeSent] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleInitiate2Fa = async () => {
    setLoading2Fa(true); setMsg(null);
    try {
      const resp = await api.post('/auth/2fa/setup', null, {
        params: { method: selectedMethod }
      });
      setSetupData(resp.data);
      setTotpCode('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to initiate 2FA setup.' });
    } finally {
      setLoading2Fa(false);
    }
  };

  const handleEnable2Fa = async () => {
    setLoading2Fa(true); setMsg(null);
    try {
      await api.post('/auth/2fa/enable', { code: totpCode });
      await refreshUser();
      setMsg({ type: 'success', text: 'Two-factor authentication enabled successfully.' });
      setSetupData(null);
      setTotpCode('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Invalid verification code.' });
    } finally {
      setLoading2Fa(false);
    }
  };

  const handleRequestDisableCode = async () => {
    setLoading2Fa(true); setMsg(null);
    try {
      await api.post('/auth/2fa/disable/request');
      setDisableCodeSent(true);
      setMsg({ type: 'success', text: 'Verification code sent to your registered contact.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to send verification code.' });
    } finally {
      setLoading2Fa(false);
    }
  };

  const handleDisable2Fa = async () => {
    setLoading2Fa(true); setMsg(null);
    try {
      await api.post('/auth/2fa/disable', { code: totpCode });
      await refreshUser();
      setMsg({ type: 'success', text: 'Two-factor authentication disabled successfully.' });
      setTotpCode('');
      setDisableCodeSent(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Invalid verification code.' });
    } finally {
      setLoading2Fa(false);
    }
  };

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
  ];

  return (
    <div className="max-w-6xl space-y-6">
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
        <div className="clay-card rounded-3xl p-6 space-y-5 max-w-2xl">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="clay-card rounded-3xl p-6 space-y-5">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">New Password</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              <button 
                type="submit"
                disabled={changingPassword}
                className="clay-button-primary px-6 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50"
              >
                {changingPassword ? <Loader size="sm" /> : 'Update Password'}
              </button>
            </div>
          </form>

          {/* Two-Factor Authentication Card */}
          <div className="clay-card rounded-3xl p-6 space-y-5">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-primary" />
              <span>Two-Factor Authentication (2FA)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed max-w-xl">
              Protect your account with an extra layer of security. Verify logins with a code generated by Google Authenticator, Authy, or other TOTP clients.
            </p>

            {user?.is_2fa_enabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-emerald text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>2FA is enabled via {user.two_factor_method === 'totp' ? 'Authenticator App (TOTP)' : user.two_factor_method === 'sms' ? 'SMS Verification' : 'Email Verification'}</span>
                </div>
                <div className="space-y-3 max-w-sm">
                  {user.two_factor_method !== 'totp' && !disableCodeSent ? (
                    <button 
                      onClick={handleRequestDisableCode} 
                      disabled={loading2Fa} 
                      className="clay-button-primary w-full py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50"
                    >
                      {loading2Fa ? <Loader size="sm" /> : 'Send Verification Code to Disable'}
                    </button>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">
                          {user.two_factor_method === 'totp' ? 'Authenticator Code' : 'Verification Code'} to Disable
                        </label>
                        <input 
                          type="text" 
                          maxLength={6} 
                          value={totpCode} 
                          onChange={e => setTotpCode(e.target.value)} 
                          className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono tracking-widest text-center" 
                          placeholder="123456" 
                        />
                      </div>
                      <div className="flex gap-2">
                        {user.two_factor_method !== 'totp' && (
                          <button 
                            onClick={() => setDisableCodeSent(false)} 
                            className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        )}
                        <button 
                          onClick={handleDisable2Fa} 
                          disabled={loading2Fa || totpCode.length !== 6} 
                          className="clay-button-secondary border border-red-500/30 text-red-500 dark:text-red-400 flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50"
                        >
                          {loading2Fa ? <Loader size="sm" /> : 'Disable 2FA'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {setupData ? (
                  <div className="space-y-4 bg-slate-50 dark:bg-white/[0.01] p-5 rounded-2xl border border-slate-200/40 dark:border-white/5 max-w-lg">
                    {selectedMethod === 'totp' ? (
                      <>
                        <div className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                          1. Scan this QR code in your Authenticator app:
                        </div>
                        <div className="flex justify-center p-3 bg-white rounded-2xl w-fit mx-auto shadow-md">
                          <QRCodeSVG value={setupData.otpauth_url || ''} size={150} />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 text-center">
                          Or enter this secret key manually: <span className="font-mono font-bold text-slate-700 dark:text-indigo-400 block mt-1 select-all">{setupData.secret}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed text-center py-2">
                        We have sent a verification code to your registered{' '}
                        <strong>{selectedMethod === 'sms' ? `phone (${setupData.phone})` : `email (${setupData.email})`}</strong>.<br />
                        Please enter the 6-digit code below to verify your settings.
                      </div>
                    )}
                    <div className="space-y-3 max-w-sm mx-auto border-t border-slate-200/20 dark:border-white/5 pt-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 text-center">Enter the 6-digit code to confirm:</label>
                        <input 
                          type="text" 
                          maxLength={6} 
                          value={totpCode} 
                          onChange={e => setTotpCode(e.target.value)} 
                          className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono tracking-widest text-center" 
                          placeholder="123456" 
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSetupData(null)} 
                          className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleEnable2Fa} 
                          disabled={loading2Fa || totpCode.length !== 6} 
                          className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50"
                        >
                          {loading2Fa ? <Loader size="sm" /> : 'Confirm & Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Choose Verification Method:</label>
                    <div className="grid grid-cols-1 gap-2.5 max-w-xl">
                      {[
                        { id: 'totp', label: 'Authenticator App', desc: 'Google Authenticator, Authy, etc.', icon: Smartphone },
                        { id: 'sms', label: 'SMS OTP Code', desc: 'Verification code sent to your phone', icon: MessageSquare },
                        { id: 'email', label: 'Email OTP Code', desc: 'Verification code sent to your inbox', icon: Mail },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m.id as any)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${selectedMethod === m.id ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20' : 'border-slate-200 dark:border-white/5 bg-white/5 hover:bg-white/10'}`}
                        >
                          <m.icon className={`w-5 h-5 shrink-0 mt-0.5 ${selectedMethod === m.id ? 'text-brand-primary' : 'text-slate-400 dark:text-gray-500'}`} />
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">{m.label}</div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">{m.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={handleInitiate2Fa} 
                      disabled={loading2Fa} 
                      className="clay-button-primary px-6 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all"
                    >
                      {loading2Fa ? <Loader size="sm" /> : 'Enable Two-Factor Authentication'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="clay-card rounded-3xl p-6 space-y-4 max-w-2xl">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Notification Preferences</h3>
          {[
            { id: 'campaign', label: 'Campaign completion alerts', icon: Send },
            { id: 'balance', label: 'Low balance warnings', icon: AlertTriangle },
            { id: 'reports', label: 'Weekly reports', icon: BarChart2 },
            { id: 'api', label: 'API usage alerts', icon: Terminal },
            { id: 'security', label: 'Security notifications', icon: Lock }
          ].map(n => (
            <label key={n.id} className="flex items-center justify-between py-2.5 cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <n.icon className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                <span className="text-sm text-slate-700 dark:text-gray-300">{n.label}</span>
              </div>
              <div className="relative w-10 h-6 bg-brand-primary/20 rounded-full"><div className="absolute left-1 top-1 w-4 h-4 bg-brand-primary rounded-full transition-transform" /></div>
            </label>
          ))}
        </div>
      )}


    </div>
  );
}
