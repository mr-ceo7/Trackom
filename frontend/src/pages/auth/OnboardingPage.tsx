/**
 * OnboardingPage - complete profile setup for OAuth/Google users.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TrackomLogo from '../../components/TrackomLogo';
import Loader from '../../components/Loader';
import api from '../../services/api';

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If user is already set up (has a phone number), send them to the dashboard
  useEffect(() => {
    if (user && user.phone) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const initialType = searchParams.get('type') === 'reseller' ? 'reseller' : 'business';
  const [accountType, setAccountType] = useState<'business' | 'reseller'>(initialType);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if user loads after mount
  useEffect(() => {
    if (user && !fullName) {
      setFullName(user.full_name || '');
    }
  }, [user, fullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Normalize phone number to start with +254
      const normalizedPhone = phone ? `+254${phone.replace(/^0/, '')}` : '';
      
      await api.put('/users/me', {
        full_name: fullName,
        phone: normalizedPhone || undefined,
        company: company || undefined,
        account_type: accountType
      });

      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const { parseApiError } = await import('../../utils');
      setError(parseApiError(err, 'Failed to save details. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4FD] dark:bg-surface-dark">
      {/* LEFT BRANDED PANEL */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-gradient-to-br from-[#06B6D4] via-[#6366F1] to-[#4338CA] p-12 flex-col justify-between">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <TrackomLogo size={32} textColorClass="text-white" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
            Complete your profile.
            <br /><span className="text-white/80">Unlock B2B features.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed">
            Configure your account details to start sending messages and managing clients.
          </p>
          <div className="flex items-center gap-3 text-sm text-white/70">
            {['No credit card needed', 'Instant setup', 'Secure routing'].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-white/30 font-medium">© 2026 Trackom Group</div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-4"><TrackomLogo size={28} /></div>

          <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Almost there!</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Please provide a few additional details to activate your dashboard.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="John Doe" />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone Number</label>
                <div className="clay-input flex items-center px-4 py-0 rounded-2xl transition-all">
                  <span className="text-slate-500 dark:text-gray-400 text-sm font-mono pr-2 border-r border-slate-200 dark:border-white/10">+254</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full py-3 bg-transparent text-slate-900 dark:text-white focus:outline-none text-sm ml-2" placeholder="712345678" />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Company Name</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="Your Company Ltd (optional)" />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['business', 'reseller'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setAccountType(type)} className={`p-4 rounded-2xl cursor-pointer transition-all text-left ${accountType === type ? 'clay-nav-active border-brand-primary' : 'clay-button-secondary border-transparent'}`}>
                      <div className={`text-sm font-bold capitalize ${accountType === type ? 'text-brand-primary font-semibold' : 'text-slate-700 dark:text-gray-300'}`}>{type}</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 leading-normal">{type === 'business' ? 'Send SMS for your business' : 'Resell SMS to your clients'}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="clay-button-primary w-full py-3 rounded-2xl text-white text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2 mt-2">
                {isSubmitting ? <Loader size="sm" /> : <span>Complete Setup <ArrowRight className="w-4 h-4" /></span>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
