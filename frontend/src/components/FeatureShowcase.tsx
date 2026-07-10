import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, AnimatePresence } from 'motion/react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { CheckCircle2, MessageSquare, ShieldCheck, Repeat, Briefcase } from 'lucide-react';

const features = [
  {
    type: 'video' as const,
    src: '/videos/animate_it.mp4',
    title: 'Dynamic Automated Journeys',
    description: 'Build triggered sequences based on customer behavior - from M-Pesa payment confirmations to appointment reminders.',
  },
  {
    type: 'image' as const,
    src: '/videos/as2.png',
    title: 'Advanced Audience Segmentation',
    description: 'Target specific segments by county, network, purchase history, and real-time behavioral data.',
  },
  {
    type: 'video' as const,
    src: '/videos/add_micro_animations_and_gener.mp4',
    title: 'Multi-Channel Synergy',
    description: 'Orchestrate seamless campaigns across SMS, WhatsApp, USSD, and voice from one unified view.',
  },
];



/* ──────────────────────────────────
   MOBILE BENTO LIST
   ────────────────────────────────── */
function MobileBentoList() {
  return (
    <div className="md:hidden pt-8 pb-12 px-4 flex flex-col gap-6 bg-[#E8ECF9] dark:bg-[#0A0A0F] transition-colors duration-300">
      <div className="text-center max-w-sm mx-auto mb-2">
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl leading-[1.15] tracking-tight text-balance mb-2">
          Automate Campaigns. Personalize Every Message.
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
          From M-Pesa payment confirmations to flash sale alerts - build data-driven customer journeys that convert.
        </p>
      </div>

      <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
        {/* Feature 1: Dynamic Automated Journeys (Vertical Bento Card) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-col p-5 gap-4 bg-white dark:bg-[#0e1422] transition-colors duration-300">
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[10px] font-mono font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Automated Workflows</span>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight">
              {features[0].title}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
              {features[0].description}
            </p>
          </div>

          <ul className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-gray-300 text-left">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              <span>Instant triggers on Lipa Na M-Pesa</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              <span>Custom delays & schedules</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              <span>Drag-and-drop designer</span>
            </li>
          </ul>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/10 flex items-center justify-center border border-slate-100 dark:border-white/5">
            <video autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none">
              <source src={features[0].src} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Feature 2: Advanced Audience Segmentation (Horizontal Bento Card) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-row items-center justify-between p-4.5 gap-4.5 bg-white dark:bg-[#0e1422] transition-colors duration-300">
          <div className="flex-1 flex flex-col gap-1.5 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Targeted Delivery</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Safaricom & Airtel</span>
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              {features[1].title}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-[11px] leading-relaxed line-clamp-3">
              {features[1].description}
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center border border-slate-100 dark:border-white/5 shrink-0">
            <img src={features[1].src} alt={features[1].title} className="w-full h-full object-cover select-none pointer-events-none" />
          </div>
        </div>

        {/* Feature 3: Multi-Channel Synergy (Horizontal Bento Card) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-row items-center justify-between p-4.5 gap-4.5 bg-white dark:bg-[#0e1422] transition-colors duration-300">
          <div className="flex-1 flex flex-col gap-1.5 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider">Omnichannel</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold font-mono">SMS • WhatsApp • USSD</span>
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              {features[2].title}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-[11px] leading-relaxed line-clamp-3">
              {features[2].description}
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center border border-slate-100 dark:border-white/5 shrink-0">
            <video autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none">
              <source src={features[2].src} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Link to="/login" className="w-full max-w-md px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-300 text-center">
          Get Started Now
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────
   DESKTOP BENTO GRID
   ────────────────────────────────── */
function DesktopBentoGrid() {
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={gridRef} className={`hidden md:block mb-8 scroll-animate ${gridVisible ? 'is-visible' : ''}`}>
      <div className="grid md:grid-cols-3 md:grid-rows-2 gap-5 lg:gap-6">
        {/* Hero card - col 1-2, row 1-2 */}
        <div className="md:col-span-2 md:row-span-2 flex">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-blue-500/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 group hover:scale-[1.01] transition-transform duration-500 relative min-h-[550px]">
            {/* Background Video */}
            <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-700 opacity-60">
                <source src={features[0].src} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80" />
            </div>

            {/* Overlaid Text Content */}
            <div className="relative z-10 p-8 flex flex-col gap-6 justify-between h-full flex-grow">
              <div className="flex flex-col gap-3">
                <h3 className="font-display font-bold text-white text-2xl md:text-3xl lg:text-4xl leading-tight">{features[0].title}</h3>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl">{features[0].description}</p>
              </div>

              {/* Solutions Grid - Directly after description */}
              <div className="flex flex-col gap-4 mt-2">
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Integrated Solutions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h5 className="text-base md:text-lg font-bold text-white uppercase">SMS Marketing</h5>
                      <p className="text-sm md:text-base text-slate-300 leading-normal">Promotional campaigns with smart routing.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h5 className="text-base md:text-lg font-bold text-white uppercase">OTP Alerts</h5>
                      <p className="text-sm md:text-base text-slate-300 leading-normal">Secure verification delivery (&lt;180ms).</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Repeat className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h5 className="text-base md:text-lg font-bold text-white uppercase">Two-Way SMS</h5>
                      <p className="text-sm md:text-base text-slate-300 leading-normal">Engage audiences with shortcodes.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h5 className="text-base md:text-lg font-bold text-white uppercase">Reseller Portal</h5>
                      <p className="text-sm md:text-base text-slate-300 leading-normal">White-label portals &amp; custom pricing.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist - Below the Solutions */}
              <div className="flex flex-col gap-4 pt-6 border-t border-white/10 mt-2">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Key Capabilities</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <li className="flex items-start gap-3.5 text-sm md:text-base text-slate-200">
                    <CheckCircle2 className="w-5.5 h-5.5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Instant triggers on Lipa Na M-Pesa payments</span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm md:text-base text-slate-200">
                    <CheckCircle2 className="w-5.5 h-5.5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Custom delays, time windows &amp; schedules</span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm md:text-base text-slate-200">
                    <CheckCircle2 className="w-5.5 h-5.5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Drag-and-drop workflow designer</span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm md:text-base text-slate-200">
                    <CheckCircle2 className="w-5.5 h-5.5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Automatic failover to backup carrier routes</span>
                  </li>
                </ul>
              </div>

              {/* Bottom CTA */}
              <div className="pt-6 border-t border-white/10 flex justify-start">
                <Link
                  to="/login"
                  className="h-12 px-8 rounded-full text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center border border-transparent shadow-lg shadow-blue-500/20"
                >
                  Configure Automated Journey
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Top-right card */}
        <div className="flex">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-emerald-500/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 group hover:scale-[1.02] transition-transform duration-300">
            <div className="p-6 pb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl md:text-2xl mb-2 leading-tight">{features[1].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-3">{features[1].description}</p>
              <ul className="flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-white/5 mb-1 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Filter contacts by County & Age group</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Live Safaricom, Airtel & Telkom routing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Import directly from Excel, CSV, or APIs</span>
                </li>
              </ul>
            </div>
            <div className="relative w-full aspect-video md:flex-1 overflow-hidden bg-black/10 flex items-center justify-center">
              <img src={features[1].src} alt={features[1].title} className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700" />
            </div>
          </div>
        </div>

        {/* Bottom-right card */}
        <div className="flex">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-purple-500/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 group hover:scale-[1.02] transition-transform duration-300">
            <div className="p-6 pb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl md:text-2xl mb-2 leading-tight">{features[2].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-3">{features[2].description}</p>
              <ul className="flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-white/5 mb-1 text-xs md:text-sm text-slate-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Official WhatsApp Business API</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Voice Broadcasting & Interactive IVR</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Interactive USSD menus (*141# etc.)</span>
                </li>
              </ul>
            </div>
            <div className="relative w-full aspect-video md:flex-1 overflow-hidden bg-black/10 flex items-center justify-center">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700">
                <source src={features[2].src} type="video/mp4" />
              </video>
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
export default function FeatureShowcase() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section id="features" className="relative bg-[#E8ECF9] dark:bg-[#0A0A0F] transition-colors duration-300 scroll-mt-24">
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-accent/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 hidden md:block pt-10 pb-14">
        <div ref={headerRef} className={`flex flex-col gap-3 text-center max-w-3xl mx-auto mb-10 scroll-animate ${headerVisible ? 'is-visible' : ''}`}>
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight text-balance">
            Automate Campaigns.{' '}<br className="hidden sm:block" />Personalize Every Message.
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            From M-Pesa payment confirmations to flash sale alerts - build data-driven customer journeys that convert across Kenya's mobile-first market.
          </p>
        </div>

        <DesktopBentoGrid />

        <div ref={ctaRef} className={`flex justify-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}>
          <Link to="/login" className="px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center">
            Get Started Now
          </Link>
        </div>
      </div>

      <MobileBentoList />
    </section>
  );
}
