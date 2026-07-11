/**
 * ContactPage - dedicated public support & sales inquiry portal.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import TrackomLogo from '../components/TrackomLogo';
import Footer from '../components/Footer';
import api from '../services/api';
import Loader from '../components/Loader';

export default function ContactPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('sales');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      await api.post('/inquiries', {
        full_name: fullName,
        email,
        company: company || null,
        phone: phone || null,
        inquiry_type: inquiryType,
        subject,
        message,
      });

      setResult({
        type: 'success',
        text: 'Thank you! Your inquiry has been received. Our team will contact you shortly.',
      });
      // Clear fields
      setFullName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setResult({
        type: 'error',
        text: err.response?.data?.detail || 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark transition-colors duration-300 relative flex flex-col justify-between font-sans">
      <Header />

      {/* DOT GRID OVERLAY */}
      <div className="absolute inset-0 dot-grid pointer-events-none z-0 opacity-50" />

      <main className="flex-grow pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary font-mono mb-4">
            <MessageSquare className="w-3 h-3" /> GET IN TOUCH
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">Contact Our Team</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">
            Have questions about custom developer setups, high-volume pricing, or USSD certifications? We are here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
          {/* Inquiry form - 3 Cols */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Inquiry Details</h3>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-start gap-2 p-4 rounded-xl border text-sm font-medium ${
                      result.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}
                  >
                    {result.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span>{result.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name *</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm transition-all" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Business Email *</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm transition-all" 
                      placeholder="you@company.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Company Name</label>
                    <input 
                      type="text" 
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm transition-all" 
                      placeholder="e.g. Acme Inc." 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm font-mono transition-all" 
                      placeholder="+254 700 000 000" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Inquiry Type *</label>
                  <select
                    value={inquiryType}
                    onChange={e => setInquiryType(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm cursor-pointer"
                  >
                    <option value="sales">Sales & Volume Pricing</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnerships & Integrations</option>
                    <option value="other">Other / General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Subject *</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm transition-all" 
                    placeholder="e.g. Requesting custom SMS rate sheet" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Message *</label>
                  <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required 
                    rows={5} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary text-sm transition-all resize-none" 
                    placeholder="Provide detailed context on your request..." 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader size="sm" />
                  ) : (
                    <>
                      <span>Send Inquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Info Sidepane - 2 Cols */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Contact Channels</h3>
                
                <div className="space-y-4">
                  {[
                    { icon: <Mail className="w-5 h-5 text-brand-primary" />, label: 'General & Support Email', val: 'support@trackomgroup.com' },
                    { icon: <Phone className="w-5 h-5 text-brand-accent" />, label: 'Sales Hotline', val: '+254 700 123 456' },
                    { icon: <MapPin className="w-5 h-5 text-brand-emerald" />, label: 'Nairobi Office', val: 'Delta Corner, Upper Hill, Nairobi, Kenya' },
                    { icon: <Clock className="w-5 h-5 text-purple-500" />, label: 'Business Hours', val: 'Mon - Fri, 8:00 AM - 5:00 PM EAT' }
                  ].map((chan) => (
                    <div key={chan.label} className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                        {chan.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{chan.label}</div>
                        <div className="text-sm font-medium text-slate-800 dark:text-gray-200 mt-0.5">{chan.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/6 pt-6 space-y-3">
                <h4 className="text-sm font-display font-semibold text-slate-900 dark:text-white">Compliance Note</h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                  Trackom complies fully with CA Kenya regulations. All Sender IDs require active documentation verification. If you require whitelisting, please request the exact Sender ID matches on your corporate credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
