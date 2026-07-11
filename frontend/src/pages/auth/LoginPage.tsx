/**
 * LoginPage - split layout with branded panel + login form.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TrackomLogo from '../../components/TrackomLogo';
import Loader from '../../components/Loader';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

export default function LoginPage() {
  const { login, login2Fa, googleAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google login failed: no credential received.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const data = await googleAuth(credentialResponse.credential);
      if (data?.onboarding_required) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2FA login challenge states
  const [show2FaChallenge, setShow2FaChallenge] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [method, setMethod] = useState<'totp' | 'sms' | 'email'>('totp');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await login(email, password);
      if (data && data.require_2fa) {
        setTempToken(data.temp_token || '');
        setMethod(data.method || 'totp');
        setShow2FaChallenge(true);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const { parseApiError } = await import('../../utils');
      setError(parseApiError(err, 'Login failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login2Fa(tempToken, totpCode);
      navigate(from, { replace: true });
    } catch (err: any) {
      const { parseApiError } = await import('../../utils');
      setError(parseApiError(err, 'Verification failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4FD] dark:bg-surface-dark">
      {/* LEFT BRANDED PANEL */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-gradient-to-br from-[#4338CA] via-[#6366F1] to-[#06B6D4] p-12 flex-col justify-between">
        {/* Background effects */}
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-60 h-60 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative z-10">
          <Link to="/">
            <TrackomLogo size={32} textColorClass="text-white" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 space-y-6"
        >
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
            Send smarter.
            <br />
            <span className="text-white/80">Scale faster.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed">
            Access Kenya's most powerful enterprise messaging platform. Bulk SMS, WhatsApp API, USSD, and more.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            {[
              { value: '2B+', label: 'Messages Sent' },
              { value: '99.99%', label: 'Uptime' },
              { value: '<180ms', label: 'Delivery' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                <div className="text-xs text-white/50 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-white/30 font-medium">
          © 2026 Trackom Group. All rights reserved.
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Link to="/"><TrackomLogo size={28} /></Link>
          </div>

          <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
            {show2FaChallenge ? (
              <>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Security Verification</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    {method === 'totp' && 'Enter the 6-digit authentication code from your authenticator app to secure your session.'}
                    {method === 'sms' && 'Enter the 6-digit verification code sent to your registered phone number.'}
                    {method === 'email' && 'Enter the 6-digit verification code sent to your email address.'}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleVerify2Fa} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 text-center">Authentication Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      required
                      autoFocus
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono tracking-widest text-center"
                      placeholder="123456"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || totpCode.length !== 6}
                    className="clay-button-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-300 disabled:opacity-60 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <Loader size="sm" />
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShow2FaChallenge(false); setTotpCode(''); setError(''); }}
                    className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                  >
                    Back to Login
                  </button>
                </form>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Welcome back</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 mb-4">
                    Sign in to your Trackom account
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Google OAuth */}
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Authentication Failed')}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/6" />
                  <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">or sign in with email</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/6" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all"
                      placeholder="you@company.co.ke"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Password</label>
                      <Link to="/forgot-password" className="text-xs text-brand-primary hover:text-brand-primary-hover font-medium transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="clay-input w-full px-4 py-3 pr-11 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="clay-button-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-300 disabled:opacity-60 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <Loader size="sm" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-slate-500 dark:text-gray-400 font-medium">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors">
                    Create one free
                  </Link>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
