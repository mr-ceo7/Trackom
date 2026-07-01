/**
 * ForgotPasswordPage — email input → success confirmation.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import TrackomLogo from '../../components/TrackomLogo';
import Loader from '../../components/Loader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Ignore errors — always show success to prevent enumeration
    }
    setIsSubmitting(false);
    setIsSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4FD] dark:bg-surface-dark p-6">
      <div className="absolute inset-0 dot-grid pointer-events-none opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-block"><TrackomLogo size={28} /></Link>
        </div>

        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          {isSent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl clay-icon-raised flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-brand-emerald drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Check your email</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  If an account exists for <strong className="text-slate-700 dark:text-gray-200">{email}</strong>, we've sent password reset instructions.
                </p>
              </div>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white clay-button-primary cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="text-center flex flex-col items-center space-y-4">
                <div className="w-14 h-14 rounded-2xl clay-icon-raised flex items-center justify-center">
                  <Mail className="w-7 h-7 text-brand-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reset your password</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
              </div>

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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-button-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-300 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader size="sm" />
                  ) : (
                    <>Send Reset Link<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-center text-sm text-slate-500 dark:text-gray-400 font-medium">
                  Remember your password?{' '}
                  <Link to="/login" className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors">Sign in</Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
