import { useRef, useState, useEffect } from 'react';
import { motion, useScroll } from 'motion/react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { CheckCircle2 } from 'lucide-react';

const controlFeatures = [
  {
    type: 'image' as const,
    src: '/images/ass1.png',
    title: 'Smart Audience Segments',
    description: 'Harness real-time data and behavior to build precise, high-conversion audience groups across all Kenyan networks.',
    bgClass: 'bg-white dark:bg-[#0f1524]',
    borderClass: 'border-slate-200 dark:border-emerald-500/10',
  },
  {
    type: 'image' as const,
    src: '/images/Gemini_Generated_Image_jac908jac908jac9 (Edited 2).png',
    title: 'Integrated Automated Workflows',
    description: 'Create conditional logic flows, trigger SMS from M-Pesa transactions, and personalize user journeys at scale.',
    bgClass: 'bg-white dark:bg-[#161d29]',
    borderClass: 'border-slate-200 dark:border-blue-500/10',
  },
  {
    type: 'image' as const,
    src: '/images/Gemini_Generated_Image_jac908jac908jac9 (Edited).png',
    title: 'Deep Analytics & Insights Dashboard',
    description: 'Go beyond delivery stats - track ROI per campaign, analyze engagement heatmaps, and optimize message content.',
    bgClass: 'bg-white dark:bg-[#1a2433]',
    borderClass: 'border-slate-200 dark:border-violet-500/10',
  },
];



/* ──────────────────────────────────
   MOBILE BENTO LIST
   ────────────────────────────────── */
function MobileBentoList() {
  return (
    <div className="md:hidden py-12 px-4 flex flex-col gap-6 bg-[#E8ECF9] dark:bg-[#0A0A0F] transition-colors duration-300">
      <div className="text-center max-w-sm mx-auto mb-2">
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl leading-[1.15] tracking-tight text-balance mb-2">
          Command Your Bulk SMS Campaigns
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
          Segment audiences, automate drip campaigns, and track every shilling of ROI - built for Kenyan businesses.
        </p>
      </div>

      <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
        {/* Feature 1: Smart Audience Segments (Horizontal Bento Card) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-row items-center justify-between p-4.5 gap-4.5 bg-white dark:bg-[#0f1524] transition-colors duration-300">
          <div className="flex-1 flex flex-col gap-1.5 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Segmentation</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Kenyan Networks</span>
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              {controlFeatures[0].title}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-[11px] leading-relaxed line-clamp-3">
              {controlFeatures[0].description}
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center border border-slate-100 dark:border-white/5 shrink-0">
            <img src={controlFeatures[0].src} alt={controlFeatures[0].title} className="w-full h-full object-cover select-none pointer-events-none" />
          </div>
        </div>

        {/* Feature 2: Integrated Automated Workflows (Vertical Bento Card) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-col p-5 gap-4 bg-white dark:bg-[#161d29] transition-colors duration-300">
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[10px] font-mono font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Automation</span>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight">
              {controlFeatures[1].title}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
              {controlFeatures[1].description}
            </p>
          </div>

          <ul className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-gray-300 text-left">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              <span>Real-time Lipa Na M-Pesa webhooks</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              <span>Dynamic drip campaigns & custom delays</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              <span>Advanced anti-spam route shuffle</span>
            </li>
          </ul>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/10 flex items-center justify-center border border-slate-100 dark:border-white/5">
            <img src={controlFeatures[1].src} alt={controlFeatures[1].title} className="w-full h-full object-cover select-none pointer-events-none" />
          </div>
        </div>

        {/* Feature 3: Deep Analytics & Insights Dashboard (Horizontal Bento Card) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-row items-center justify-between p-4.5 gap-4.5 bg-white dark:bg-[#1a2433] transition-colors duration-300">
          <div className="flex-1 flex flex-col gap-1.5 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider">Analytics</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold font-mono">ROI Tracking</span>
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              {controlFeatures[2].title}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-[11px] leading-relaxed line-clamp-3">
              {controlFeatures[2].description}
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center border border-slate-100 dark:border-white/5 shrink-0">
            <img src={controlFeatures[2].src} alt={controlFeatures[2].title} className="w-full h-full object-cover select-none pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────
   DESKTOP REVERSED BENTO GRID
   ────────────────────────────────── */
function DesktopBentoGrid() {
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={gridRef} className={`hidden md:block mb-8 scroll-animate ${gridVisible ? 'is-visible' : ''}`}>
      <div className="grid md:grid-cols-3 md:grid-rows-2 gap-5 lg:gap-6">
        {/* Top-left card (Smart Audience Segments) */}
        <div className="flex">
          <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 border group hover:scale-[1.02] transition-transform duration-300 ${controlFeatures[0].bgClass} ${controlFeatures[0].borderClass}`}>
            <div className="p-6 pb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl md:text-2xl mb-2 leading-tight">{controlFeatures[0].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-3">{controlFeatures[0].description}</p>
              <ul className="flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-white/5 mb-1 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary">👥</span>
                  <span>Real-time dynamic group updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-emerald">🚫</span>
                  <span>Automated CA Kenya DND filter checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-accent">🔄</span>
                  <span>Direct database synchronization</span>
                </li>
              </ul>
            </div>
            <div className="relative w-full aspect-video md:flex-1 overflow-hidden bg-black/10 flex items-center justify-center">
              <img src={controlFeatures[0].src} alt={controlFeatures[0].title} className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700" />
            </div>
          </div>
        </div>

        {/* Hero card - col 2-3, row 1-2 (Deep Analytics - right side) */}
        <div className="md:col-span-2 md:row-span-2 flex">
          <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 border group hover:scale-[1.01] transition-transform duration-500 ${controlFeatures[2].bgClass} ${controlFeatures[2].borderClass}`}>
            <div className="p-8 pb-5 flex-grow-0">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl md:text-3xl lg:text-4xl mb-3 leading-tight">{controlFeatures[2].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed mb-4">{controlFeatures[2].description}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-4 border-t border-slate-200 dark:border-white/5 mb-2">
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                  <span className="text-brand-primary">📈</span>
                  <span>AI campaign CTR optimizations</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                  <span className="text-brand-accent">💰</span>
                  <span>Sales conversion ROI tracking</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                  <span className="text-brand-emerald">📊</span>
                  <span>Exportable reports (PDF/CSV/Excel)</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                  <span className="text-brand-primary">⏳</span>
                  <span>Real-time carrier latency graphs</span>
                </div>
              </div>
            </div>
            <div className="relative flex-1 min-h-[300px] overflow-hidden flex items-center justify-center bg-black/10">
              <img src={controlFeatures[2].src} alt={controlFeatures[2].title} className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-700" />
            </div>
          </div>
        </div>

        {/* Bottom-left card (Integrated Automated Workflows) */}
        <div className="flex">
          <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 border group hover:scale-[1.02] transition-transform duration-300 ${controlFeatures[1].bgClass} ${controlFeatures[1].borderClass}`}>
            <div className="p-6 pb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl md:text-2xl mb-2 leading-tight">{controlFeatures[1].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-3">{controlFeatures[1].description}</p>
              <ul className="flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-white/5 mb-1 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary">⚡</span>
                  <span>M-Pesa transaction sync webhooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-emerald">🔄</span>
                  <span>Dynamic drip campaigns & delays</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-accent">🛡️</span>
                  <span>Advanced anti-spam route shuffle</span>
                </li>
              </ul>
            </div>
            <div className="relative w-full aspect-video md:flex-1 overflow-hidden bg-black/10 flex items-center justify-center">
              <img src={controlFeatures[1].src} alt={controlFeatures[1].title} className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────── */
export default function BulkSMSControl() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className="relative bg-[#E8ECF9] dark:bg-[#0A0A0F] py-10 md:py-14 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5">
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-brand-primary/[0.03] blur-[110px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] rounded-full bg-brand-accent/[0.03] blur-[110px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 hidden md:block">
        <div ref={headerRef} className={`flex flex-col gap-3 text-center max-w-3xl mx-auto mb-10 scroll-animate ${headerVisible ? 'is-visible' : ''}`}>
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight text-balance">
            Command Your Bulk SMS Campaigns{' '}<br className="hidden sm:block" />with Enterprise-Grade Control
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Segment audiences by county, automate drip campaigns via M-Pesa triggers, and track every shilling of ROI - all from one dashboard built for Kenyan businesses.
          </p>
        </div>

        <DesktopBentoGrid />
      </div>

      <MobileBentoList />
    </section>
  );
}
