/**
 * RegisterPage — multi-step registration form.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TrackomLogo from '../../components/TrackomLogo';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState<'business' | 'reseller'>('business');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Personal Info', 'Company', 'Security'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await register({ full_name: fullName, email, password, phone: phone ? `+254${phone}` : undefined, company: company || undefined, account_type: accountType });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordChecks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
  ];
  const isPasswordValid = passwordChecks.every((c) => c.pass);

  return (
    <div className="min-h-screen flex bg-[#F3F4FD] dark:bg-surface-dark">
      {/* LEFT BRANDED PANEL */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-gradient-to-br from-[#06B6D4] via-[#6366F1] to-[#4338CA] p-12 flex-col justify-between">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <Link to="/"><TrackomLogo size={32} textColorClass="text-white" /></Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
            Start free.
            <br /><span className="text-white/80">10,000 SMS credits.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed">
            Create your account in under 60 seconds. No credit card required. Get instant API access.
          </p>
          <div className="flex items-center gap-3 text-sm text-white/70">
            {['Free forever plan', 'M-Pesa payments', 'API access'].map((f) => (
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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-8">
          <div className="lg:hidden"><Link to="/"><TrackomLogo size={28} /></Link></div>

          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Create your account</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Step {step} of 3 — {steps[step - 1]}</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-white/10'}`} />
            ))}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm transition-all" placeholder="john@company.co.ke" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone Number</label>
                    <div className="flex">
                      <span className="flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] text-slate-500 dark:text-gray-400 text-sm font-mono">+254</span>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-r-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm transition-all" placeholder="712345678" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Company Name</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm transition-all" placeholder="Your Company Ltd (optional)" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Account Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['business', 'reseller'] as const).map((type) => (
                        <button key={type} type="button" onClick={() => setAccountType(type)} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${accountType === type ? 'border-brand-primary/40 bg-brand-primary/5 ring-1 ring-brand-primary/10' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                          <div className={`text-sm font-semibold capitalize ${accountType === type ? 'text-brand-primary' : 'text-slate-700 dark:text-gray-300'}`}>{type}</div>
                          <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{type === 'business' ? 'Send SMS for your business' : 'Resell SMS to your clients'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm transition-all" placeholder="Create a strong password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 cursor-pointer transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${check.pass ? 'text-brand-emerald' : 'text-slate-300 dark:text-gray-600'}`} />
                        <span className={check.pass ? 'text-brand-emerald' : 'text-slate-400 dark:text-gray-500'}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-5 py-3.5 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer transition-all border border-slate-200 dark:border-white/10">
                  <ArrowLeft className="w-4 h-4" /><span>Back</span>
                </button>
              )}
              <button type="submit" disabled={isSubmitting || (step === 3 && !isPasswordValid)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-lg shadow-brand-primary/20 transition-all duration-300 disabled:opacity-60 active:scale-[0.98]">
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span>
                ) : step < 3 ? (
                  <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
                ) : (
                  <><span>Create Free Account</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
