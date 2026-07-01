/**
 * ForgotPasswordPage — email input → success confirmation.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import TrackomLogo from '../../components/TrackomLogo';

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
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-block mb-6"><TrackomLogo size={28} /></Link>
          {isSent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-emerald/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-brand-emerald" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Check your email</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                If an account exists for <strong className="text-slate-700 dark:text-gray-200">{email}</strong>, we've sent password reset instructions.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-brand-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reset your password</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </>
          )}
        </div>

        {!isSent && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm transition-all"
                placeholder="you@company.co.ke"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-lg shadow-brand-primary/20 transition-all duration-300 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <>Send Reset Link<ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors">Sign in</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
