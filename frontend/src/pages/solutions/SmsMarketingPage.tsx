import React, { useState } from 'react';
import Header from '../../components/Header';
import TrackomLogo from '../../components/TrackomLogo';
import SignupModal from '../../components/SignupModal';
import ParticleCanvas from '../../components/ParticleCanvas';
import { MessageSquare, Shield, CheckCircle2, ArrowRight, BarChart3, Users, Zap } from 'lucide-react';

export default function SmsMarketingPage() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(5000);
  
  const costPerSms = 1.0; // 1 KES
  const estimatedCost = recipientCount * costPerSms;

  return (
    <div className="min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark selection:bg-brand-primary/30 transition-colors duration-300 relative flex flex-col justify-between font-sans">
      <ParticleCanvas />
      <Header onOpenSignup={() => setIsSignupOpen(true)} />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-5 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary font-mono">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>High-Throughput Messaging</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            Engage Customers Instantly with <span className="gradient-text">Bulk SMS Marketing</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
            Drive conversions, launch promotions, and broadcast flash sales with direct, localized routes and 99.9% uptime delivery.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => setIsSignupOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Start Sending Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Excel/CSV Smart Import', desc: 'Drag and drop bulk contact spreadsheets. Uniquely sanitizes country codes and removes duplicates instantly.', icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { title: 'Personalized Placeholders', desc: 'Address subscribers by name, custom variables, or custom balances to double click-through rates.', icon: Zap, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { title: 'Campaign Analytics', desc: 'Real-time monitoring of dispatches, delivery callbacks, and carrier response latencies.', icon: BarChart3, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/10 space-y-4">
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Interactive Estimator Calculator */}
        <section className="glass-card rounded-2xl p-8 border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-left">
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Estimate Campaign Budgets</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Slide the controller to calculate target pricing across direct telecom operator lines. No setup fees, no monthly software subscriptions.
            </p>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex justify-between font-mono">
                <span>Subscribers to reach:</span>
                <span className="text-brand-primary font-bold">{recipientCount.toLocaleString()}</span>
              </label>
              <input 
                type="range" 
                min={100} 
                max={100000} 
                step={500} 
                value={recipientCount} 
                onChange={(e) => setRecipientCount(Number(e.target.value))}
                className="w-full accent-brand-primary cursor-pointer h-2 bg-slate-200 dark:bg-white/10 rounded-lg"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 space-y-4 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Estimated Cost</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">KES {estimatedCost.toLocaleString()}</div>
              <div className="text-[10px] text-brand-emerald font-bold mt-1">~ KES {costPerSms.toFixed(2)} per message</div>
            </div>
            <button 
              onClick={() => setIsSignupOpen(true)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all cursor-pointer"
            >
              Get Credits Instantly
            </button>
          </div>
        </section>

        {/* Carrier Trust Compliance */}
        <section className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200 dark:border-white/10 text-left">
          <div className="space-y-2">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-emerald" /> CA Kenya Compliant Routes
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-normal max-w-xl">
              Trackom incorporates automatic DND checking and custom opt-out links on every marketing message, keeping your company safe from carrier penalties.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 font-mono text-[10px] font-bold text-slate-400">
            {['Opt-out Automation', 'Safaricom DND Sync', 'No Hidden Fees'].map(c => (
              <span key={c} className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" /> {c}</span>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/6 py-12 px-4 md:px-8 text-center relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TrackomLogo size={20} />
          <span className="text-[10px] text-slate-500 font-medium font-mono">
            © 2026 Trackom Group. All rights reserved.
          </span>
        </div>
      </footer>

      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
}
