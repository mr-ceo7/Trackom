/**
 * SignupModal - Premium 2-Step interactive signup wizard.
 * Fits perfectly on all viewports without scrolling or overflow clipping.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Building2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google signup failed: no credential received.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const data = await googleAuth(credentialResponse.credential);
      onClose();
      if (data?.onboarding_required) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wizard Step State
  const [step, setStep] = useState(1);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState<'business' | 'reseller'>('business');

  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setCompany('');
      setAccountType('business');
      setIsSubmitting(false);
      setIsSuccess(false);
      setError('');
    }
  }, [isOpen]);

  // Validation before proceeding to Step 2
  const validateStep1 = () => {
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    return true;
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Additional Phone Validation
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Format Kenyan phone number to E.164 (e.g. +254 712345678)
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+254' + formattedPhone;
      }

      await register({
        full_name: fullName,
        email,
        password,
        phone: formattedPhone,
        company: company || undefined,
        account_type: accountType,
      });

      setIsSuccess(true);
    } catch (err: any) {
      const { parseApiError } = await import('../utils');
      setError(parseApiError(err, 'Registration failed. Please verify your details.'));
    } finally {
      setIsSubmitting(false);
    }
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
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* MODAL CONTAINER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-surface-card border border-white/8 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 max-h-[95vh] flex flex-col"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/6 shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-primary-light" />
                </div>
                <div>
                  <span className="font-display font-bold text-white text-sm block">Create Trackom Account</span>
                  {!isSuccess && (
                    <span className="text-[10px] text-gray-400 font-medium">Step {step} of 2</span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ERROR ALERTS */}
            {error && (
              <div className="px-6 pt-4 shrink-0">
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              </div>
            )}

            {/* SCROLLABLE CONTENT */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              {isSuccess ? (
                /* SUCCESS STATE */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="p-3.5 rounded-2xl bg-brand-emerald/10 text-brand-emerald relative">
                      <span className="absolute inset-0 rounded-2xl border border-brand-emerald/30 animate-ping" style={{ animationDuration: '3s' }} />
                      <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-white text-xl">Welcome to Trackom! 🎉</h3>
                  <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                    Your enterprise bulk SMS profile is active. Check your mailbox for developer documentation and your 10,000 free credits receipt.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/dashboard');
                    }}
                    className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer transition-all duration-200 mt-2 shadow-lg shadow-brand-primary/20"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              ) : (
                /* SIGNUP FORM WIZARD */
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {step === 1 ? (
                    /* STEP 1: CREDENTIALS */
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      {/* Google OAuth */}
                      <div className="w-full flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError('Google Authentication Failed')}
                        />
                      </div>

                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-white/6" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Or Register with Email</span>
                        <div className="flex-1 h-px bg-white/6" />
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-400">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] text-white focus:outline-none focus:border-brand-primary text-xs transition-all placeholder:text-gray-600"
                          placeholder="John Doe"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-400">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] text-white focus:outline-none focus:border-brand-primary text-xs transition-all placeholder:text-gray-600"
                          placeholder="john@company.co.ke"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-400">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] text-white focus:outline-none focus:border-brand-primary text-xs transition-all placeholder:text-gray-600"
                          placeholder="At least 8 characters"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-lg shadow-brand-primary/10 transition-all duration-300 mt-4"
                      >
                        <span>Continue to Business Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    /* STEP 2: BUSINESS DETAILS */
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-400">Phone Number</label>
                        <div className="flex">
                          <span className="flex items-center px-3 rounded-l-xl border border-r-0 border-white/8 bg-white/[0.04] text-gray-400 text-xs font-mono">
                            +254
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-r-xl border border-white/8 bg-white/[0.02] text-white focus:outline-none focus:border-brand-primary text-xs transition-all placeholder:text-gray-600"
                            placeholder="712345678"
                          />
                        </div>
                      </div>

                      {/* Company */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-400">Company Name</label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] text-white focus:outline-none focus:border-brand-primary text-xs transition-all placeholder:text-gray-600"
                          placeholder="Your Company Ltd"
                        />
                      </div>

                      {/* Account Type */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-gray-400">Account Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAccountType('business')}
                            className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                              accountType === 'business'
                                ? 'border-brand-primary/40 bg-brand-primary/5 text-brand-primary-light'
                                : 'border-white/8 text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            Business Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountType('reseller')}
                            className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                              accountType === 'reseller'
                                ? 'border-brand-accent/40 bg-brand-accent/5 text-brand-accent'
                                : 'border-white/8 text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            Reseller Portal
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="py-3 rounded-xl border border-white/8 text-xs font-semibold text-gray-300 hover:bg-white/5 cursor-pointer transition-all flex items-center justify-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="col-span-2 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-lg shadow-brand-primary/10 transition-all duration-300 disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <Loader size="sm" />
                          ) : (
                            <>
                              <span>Create Free Account</span>
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <p className="text-center text-[10px] text-gray-500 leading-normal pt-1">
                    By signing up, you agree to Trackom's <a href="#" className="underline hover:text-white">Terms of Service</a> & <a href="#" className="underline hover:text-white">Privacy Policy</a>.
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
