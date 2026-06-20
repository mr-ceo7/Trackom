import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState<'business' | 'reseller'>('business');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFullName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setAccountType('business');
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-surface-card border border-white/8 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/15 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-brand-primary-light" />
                </div>
                <span className="font-display font-semibold text-white text-base">Get Started with Trackom</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6">
              {isSuccess ? (
                /* SUCCESS STATE */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="p-4 rounded-2xl bg-brand-emerald/10 text-brand-emerald relative">
                      <span className="absolute inset-0 rounded-2xl border border-brand-emerald/30 animate-ping" style={{ animationDuration: '3s' }} />
                      <CheckCircle2 className="w-12 h-12 stroke-[1.5]" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-white text-2xl">Welcome to Trackom! 🎉</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Your account has been created. Check your email for login details and 10,000 free SMS credits.
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer transition-all duration-200 mt-4"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              ) : (
                /* SIGNUP FORM */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Google OAuth */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/6" />
                    <span className="text-xs text-gray-500 font-medium">or sign up with email</span>
                    <div className="flex-1 h-px bg-white/6" />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:border-brand-primary text-sm transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:border-brand-primary text-sm transition-all"
                      placeholder="john@company.co.ke"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400">Phone Number</label>
                    <div className="flex">
                      <span className="flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-white/[0.05] text-gray-400 text-sm font-mono">
                        +254
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-r-xl border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:border-brand-primary text-sm transition-all"
                        placeholder="712345678"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400">Company Name</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:border-brand-primary text-sm transition-all"
                      placeholder="Your Company Ltd"
                    />
                  </div>

                  {/* Account Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400">Account Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountType('business')}
                        className={`p-3 rounded-xl border text-center text-sm font-medium cursor-pointer transition-all ${
                          accountType === 'business'
                            ? 'border-brand-primary/40 bg-brand-primary/5 text-brand-primary-light'
                            : 'border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        Business
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('reseller')}
                        className={`p-3 rounded-xl border text-center text-sm font-medium cursor-pointer transition-all ${
                          accountType === 'reseller'
                            ? 'border-brand-accent/40 bg-brand-accent/5 text-brand-accent'
                            : 'border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        Reseller
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-lg shadow-brand-primary/20 transition-all duration-300 disabled:opacity-60 mt-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      <>
                        <span>Create Free Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
