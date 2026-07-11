import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import TrackomLogo from '../../components/TrackomLogo';
import Footer from '../../components/Footer';
import ParticleCanvas from '../../components/ParticleCanvas';
import { Briefcase, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Key } from 'lucide-react';

export default function ResellerPage() {
  const [monthlyVolume, setMonthlyVolume] = useState(50000);
  const [markupPrice, setMarkupPrice] = useState(0.2); // KES markup per SMS

  const wholesaleCost = 0.5; // KES 0.50 per SMS wholesale
  const sellingPrice = wholesaleCost + markupPrice;
  const totalCost = monthlyVolume * wholesaleCost;
  const totalRevenue = monthlyVolume * sellingPrice;
  const netProfit = totalRevenue - totalCost;

  return (
    <div className="min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark selection:bg-brand-primary/30 transition-colors duration-300 relative flex flex-col justify-between font-sans">
      <ParticleCanvas />
      <Header />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-5 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary font-mono">
            <Briefcase className="w-3.5 h-3.5" />
            <span>White-Label Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            Launch Your Own Business with the <span className="gradient-text">Reseller Portal</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
            Get your own fully branded, white-labeled bulk SMS dashboard. Purchase credits at wholesale prices and set your own profit margins.
          </p>
          <div className="pt-2">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Start Reselling Today <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Reseller Markup Calculator */}
        <section className="glass-card rounded-2xl p-8 border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5 text-left">
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Profit Margin Estimator</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Adjust your monthly message volume and target markup margins to estimate your net business earnings per month.
            </p>
            
            {/* Volume slider */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex justify-between font-mono">
                <span>Monthly SMS Volume:</span>
                <span className="text-brand-primary font-bold">{monthlyVolume.toLocaleString()}</span>
              </label>
              <input 
                type="range" 
                min={10000} 
                max={500000} 
                step={10000} 
                value={monthlyVolume} 
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full accent-brand-primary cursor-pointer h-2 bg-slate-200 dark:bg-white/10 rounded-lg"
              />
            </div>

            {/* Markup slider */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex justify-between font-mono">
                <span>Your Markup per SMS:</span>
                <span className="text-brand-primary font-bold">KES {markupPrice.toFixed(2)}</span>
              </label>
              <input 
                type="range" 
                min={0.05} 
                max={1.00} 
                step={0.05} 
                value={markupPrice} 
                onChange={(e) => setMarkupPrice(Number(e.target.value))}
                className="w-full accent-brand-primary cursor-pointer h-2 bg-slate-200 dark:bg-white/10 rounded-lg"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4 font-mono text-center">
            <div className="border-r border-slate-200 dark:border-white/5 py-2">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Wholesale Cost</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">KES {totalCost.toLocaleString()}</div>
            </div>
            <div className="py-2">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Retail Revenue</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">KES {totalRevenue.toLocaleString()}</div>
            </div>
            <div className="col-span-2 border-t border-slate-200 dark:border-white/5 pt-4">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Estimated Monthly Net Profit</div>
              <div className="text-3xl font-black text-brand-emerald mt-1">+ KES {netProfit.toLocaleString()}</div>
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '100% White-Labeled', desc: 'Host on your own custom domain (e.g. sms.yourdomain.com) with custom logos, emails, brand colors, and company information.', icon: Key, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { title: 'Sub-Account Control', desc: 'Create, suspend, or fund customer sub-accounts. Monitor their dispatches, invoices, and credit balances instantly.', icon: TrendingUp, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { title: 'API & Gateway Access', desc: 'Give your clients direct access to developer API keys, REST libraries, and SMPP binds under your own brand name.', icon: ShieldCheck, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
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
      <Footer />

    </div>
  );
}
