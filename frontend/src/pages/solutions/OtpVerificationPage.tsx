import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import TrackomLogo from '../../components/TrackomLogo';
import SignupModal from '../../components/SignupModal';
import ParticleCanvas from '../../components/ParticleCanvas';
import { ShieldCheck, ArrowRight, Shield, Cpu, Lock, RefreshCw } from 'lucide-react';

export default function OtpVerificationPage() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [otpLatency, setOtpLatency] = useState(132);

  // Fluctuate latency metric
  useEffect(() => {
    const interval = setInterval(() => {
      setOtpLatency(Math.floor(125 + Math.random() * 20));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark selection:bg-brand-primary/30 transition-colors duration-300 relative flex flex-col justify-between font-sans">
      <ParticleCanvas />
      <Header onOpenSignup={() => setIsSignupOpen(true)} />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-5 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-emerald/10 text-brand-emerald font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure OTP Delivery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            Authenticate Users Globally with <span className="text-brand-emerald">Low-Latency OTP</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
            Secure signups, transactions, and password resets using premium fallback routing. Delivering codes in under 2 seconds.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => setIsSignupOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Get Free API Key <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Latency Monitor Widget */}
        <section className="glass-card rounded-2xl p-8 border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-left">
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Active Gateway Latency</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              We monitor direct SMS routes constantly. When a carrier network gets congested, our smart router automatically hot-swaps to a backup route to prevent verification timeouts.
            </p>
            
            <div className="flex gap-4 font-mono text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-brand-emerald animate-pulse" /> Direct Operator Bind</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand-primary" /> ISO-27001 Secure</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-emerald-400">
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-2 text-[10px] text-slate-500">
              <span>📡 ACTIVE PIN SCANNER</span>
              <span className="text-brand-emerald animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 bg-brand-emerald rounded-full" /> ONLINE</span>
            </div>
            
            <div className="text-center py-4 space-y-1">
              <div className="text-4xl font-black">{otpLatency} ms</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SMS Dispatch Transit Time</div>
            </div>

            <div className="w-full text-[10px] text-slate-400 text-left space-y-1 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
              <div><code>[10:44:21] API: Received verification request</code></div>
              <div><code>[10:44:21] SYSTEM: Selected Safaricom Direct Bind</code></div>
              <div><code>[10:44:22] GATEWAY: Delivery receipt received (132ms)</code></div>
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Dynamic OTP Length', desc: 'Configure custom numbers (4-8 digits), alphabetic codes, or secure hexadecimal tokens easily via query parameters.', icon: Lock, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { title: 'Automatic Resend Controls', desc: 'Built-in request rate limiting and cooldown rules to prevent API spamming and protect your credit wallet.', icon: RefreshCw, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { title: 'DND Whitelisting', desc: 'OTP dispatches utilize transactional pathways, bypassing subscriber DND flags to ensure critical security code delivery.', icon: ShieldCheck, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
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
