/**
 * RegisterPage - multi-step registration form.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import TrackomLogo from '../../components/TrackomLogo';
import Loader from '../../components/Loader';

export default function RegisterPage() {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const initialType = searchParams.get('type') === 'reseller' ? 'reseller' : 'business';
  const [accountType, setAccountType] = useState<'business' | 'reseller'>(initialType);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Personal Info', 'Company', 'Security'];

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google signup failed: no credential received.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const data = await googleAuth(credentialResponse.credential);
      if (data?.onboarding_required) {
        const typeParam = searchParams.get('type') ? `?type=${searchParams.get('type')}` : '';
        navigate(`/onboarding${typeParam}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const parentId = searchParams.get('parent_id') || searchParams.get('ref') || undefined;
      await register({
        full_name: fullName,
        email,
        password,
        phone: phone ? `+254${phone}` : undefined,
        company: company || undefined,
        account_type: accountType,
        parent_id: parentId
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const { parseApiError } = await import('../../utils');
      setError(parseApiError(err, 'Registration failed. Please try again.'));
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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-6">
          <div className="lg:hidden"><Link to="/"><TrackomLogo size={28} /></Link></div>

          <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Create your account</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Step {step} of 3 - {steps[step - 1]}</p>
            </div>

            {/* Progress bar */}
            <div className="h-3.5 w-full rounded-full clay-inset p-0.5 flex gap-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-full flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-gradient-to-r from-brand-primary to-brand-accent shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)]' : 'bg-transparent'}`} />
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
                    {/* Google OAuth */}
                    <div className="w-full flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Authentication Failed')}
                      />
                    </div>

                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-white/6" />
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">or sign up with email</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-white/6" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="john@company.co.ke" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone Number</label>
                      <div className="clay-input flex items-center px-4 py-0 rounded-2xl transition-all">
                        <span className="text-slate-500 dark:text-gray-400 text-sm font-mono pr-2 border-r border-slate-200 dark:border-white/10">+254</span>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full py-3 bg-transparent text-slate-900 dark:text-white focus:outline-none text-sm ml-2" placeholder="712345678" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Company Name</label>
                      <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="Your Company Ltd (optional)" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Account Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['business', 'reseller'] as const).map((type) => (
                          <button key={type} type="button" onClick={() => setAccountType(type)} className={`p-4 rounded-2xl cursor-pointer transition-all ${accountType === type ? 'clay-nav-active border-brand-primary' : 'clay-button-secondary border-transparent'}`}>
                            <div className={`text-sm font-bold capitalize ${accountType === type ? 'text-brand-primary font-semibold' : 'text-slate-700 dark:text-gray-300'}`}>{type}</div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 leading-normal">{type === 'business' ? 'Send SMS for your business' : 'Resell SMS to your clients'}</div>
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
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="clay-input w-full px-4 py-3 pr-11 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="Create a strong password" />
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
                  <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-5 py-3.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-gray-400 clay-button-secondary cursor-pointer transition-all border border-transparent">
                    <ArrowLeft className="w-4 h-4" /><span>Back</span>
                  </button>
                )}
                <button type="submit" disabled={isSubmitting || (step === 3 && !isPasswordValid)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white clay-button-primary cursor-pointer transition-all duration-300 disabled:opacity-60 active:scale-[0.98]">
                  {isSubmitting ? (
                    <Loader size="sm" />
                  ) : step < 3 ? (
                    <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <><span>Create Free Account</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-gray-400 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
