import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll } from 'motion/react';
import { CheckCircle, Wifi, ShieldCheck, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const funnelCards = [
  {
    src: '/images/screen/Gemini_Generated_Image_krr99ukrr99ukrr9 (Edited).png',
    tag: 'CHANNEL SYNERGY',
    title: 'Unified Platform',
    description: 'Break silos and consolidate data from SMS, email, web, and more. Trackom unifies your customer touchpoints into a single, cohesive dashboard.',
    bgClass: 'bg-white dark:bg-[#0f1523]',
    borderClass: 'border-slate-200 dark:border-blue-500/10',
    bullets: [
      'Consolidate SMS, Email, and Push notifications in one flow',
      'Centralized customer interaction profiles and channel preferences',
      'Unified delivery reporting and intelligent retry routing'
    ]
  },
  {
    src: '/images/screen/Gemini_Generated_Image_krr99ukrr99ukrr9 (Edited 2).png',
    tag: 'BEHAVIORAL TARGETING',
    title: 'Real-time Personalization',
    description: 'Deliver the perfect message at the right moment based on live user data. Target customers dynamically based on actions they take in your app.',
    bgClass: 'bg-white dark:bg-[#181f2e]',
    borderClass: 'border-slate-200 dark:border-emerald-500/10',
    bullets: [
      'Real-time behavioral triggers and event-driven SMS rules',
      'Dynamic metadata placeholders for personalized templates',
      'Intelligent frequency capping to optimize customer experience'
    ]
  },
  {
    src: '/images/screen/Gemini_Generated_Image_krr99ukrr99ukrr9 (Edited 3).png',
    tag: 'ENTERPRISE INFRASTRUCTURE',
    title: 'Unmatched Scalability',
    description: 'Handle millions of messages with robust, reliable infrastructure and high deliverability. Built to support heavy enterprise loads with zero lag.',
    bgClass: 'bg-white dark:bg-[#0f1525]',
    borderClass: 'border-slate-200 dark:border-purple-500/10',
    bullets: [
      'High-throughput delivery engines (10,000+ messages per second)',
      '99.99% uptime guarantee with multi-carrier fallback paths',
      'Automated congestion queuing and deliverability guardrails'
    ]
  },
];



/* ──────────────────────────────────
   MOBILE DECK OF CARDS FOR FUNNEL
   ────────────────────────────────── */
function MobileDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest < 0.46) {
        setActiveIndex(0);
      } else if (latest < 0.96) {
        setActiveIndex(1);
      } else {
        setActiveIndex(2);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div ref={deckRef} className="md:hidden" style={{ height: '150vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center pt-10 pb-8 px-4">
        {/* Header */}
        <div className="text-center px-2 mb-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl leading-[1.15] tracking-tight text-balance mb-2">
            Your Complete Customer Journey - Automated
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed max-w-[280px] mx-auto">
            From first contact to repeat purchase - orchestrate SMS, WhatsApp, USSD, and voice campaigns that drive results.
          </p>
        </div>

        {/* Card stack area */}
        <div className="relative w-[85vw] max-w-[340px] aspect-[4/5] mb-6">
          {funnelCards.map((card, index) => (
            <DeckCard
              key={card.title}
              card={card}
              index={index}
              total={funnelCards.length}
              activeIndex={activeIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DeckCard({
  card,
  index,
  total,
  activeIndex,
}: {
  key?: string | number;
  card: (typeof funnelCards)[number];
  index: number;
  total: number;
  activeIndex: number;
}) {
  const isDealt = index < activeIndex;
  const isActive = index === activeIndex;
  const positionInStack = index - activeIndex;

  const animateState = isDealt
    ? { x: -350, rotate: -10, opacity: 0, y: 0, scale: 1 }
    : isActive
      ? { x: 0, rotate: 0, opacity: 1, y: 0, scale: 1 }
      : {
          x: 0,
          rotate: 0,
          opacity: 1,
          y: positionInStack * 6,
          scale: 1 - positionInStack * 0.03,
        };

  const zIndex = total - index;

  return (
    <motion.div
      className={`absolute inset-0 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/35 flex flex-col justify-between p-3.5 border ${card.bgClass} ${card.borderClass}`}
      style={{
        zIndex,
      }}
      animate={animateState}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Visual Asset Container */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
        <img
          src={card.src}
          alt={card.title}
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      </div>

      {/* Card Info */}
      <div className="pt-3 pb-1 text-center">
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-0.5 leading-tight">
          {card.title}
        </h3>
        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed px-1">
          {card.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────
   DESKTOP ALTERNATING ROWS
   ────────────────────────────────── */
function DesktopAlternatingRows() {
  return (
    <div className="hidden md:flex flex-col gap-28 mb-24">
      {funnelCards.map((card, index) => {
        const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
        const isAssetFirst = index % 2 === 0;

        return (
          <div
            key={card.title}
            ref={ref}
            className={`grid grid-cols-12 gap-8 lg:gap-16 items-center scroll-animate ${isVisible ? 'is-visible' : ''}`}
          >
            {/* Asset Container */}
            <div
              className={`col-span-12 md:col-span-6 flex justify-center ${
                isAssetFirst ? 'md:order-1' : 'md:order-2'
              }`}
            >
              <div
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/10 border p-6 flex items-center justify-center hover:scale-[1.02] transition-transform duration-300 ${card.bgClass} ${card.borderClass}`}
              >
                <img
                  src={card.src}
                  alt={card.title}
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>
            </div>

            {/* Enlarged Caption Text Container */}
            <div
              className={`col-span-12 md:col-span-6 flex flex-col gap-5 ${
                isAssetFirst ? 'md:order-2' : 'md:order-1'
              }`}
            >
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  {card.tag}
                </span>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-3xl lg:text-4xl leading-tight">
                  {card.title}
                </h3>
              </div>
              <p className="text-slate-600 dark:text-gray-300 text-base leading-relaxed">
                {card.description}
              </p>

              {/* Bullet checklist */}
              <ul className="flex flex-col gap-3 mt-2">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-gray-400">
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────── */
export default function MarketingFunnel() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: stackSectionRef, isVisible: stackSectionVisible } = useScrollAnimation({ threshold: 0.15 });

  return (
    <section className="relative bg-[#F3F4FD] dark:bg-[#07070C] py-10 md:py-14 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.02] blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER (DESKTOP / GENERAL) */}
        <div
          ref={headerRef}
          className={`hidden md:flex flex-col gap-4 text-center max-w-3xl mx-auto mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight text-balance">
            Your Complete Customer Journey - Automated
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Deliver high-impact multi-channel messaging and automate client interactions across Kenya's mobile-first economy.
          </p>
        </div>

        {/* 1. Desktop Funnel Alternating Rows */}
        <DesktopAlternatingRows />

        {/* 2. Mobile Funnel Deck */}
        <MobileDeck />

        {/* 3. Tech Stack Integration & Case Studies */}
        <div
          ref={stackSectionRef}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 mt-8 md:mt-24 items-center scroll-animate ${stackSectionVisible ? 'is-visible' : ''}`}
        >
          {/* Left Column: Tech Stack Connection */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                  Enterprise Integration Hub
                </span>
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight">
                Seamlessly Connects with Your Tech Stack
              </h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                Easily integrate with the CRM, e-commerce, and developer tools you already use. Get up and running in minutes with clean API endpoints and pre-built connectors.
              </p>
            </div>

            {/* Integration Diagram */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-lg shadow-slate-100 dark:shadow-none bg-white dark:bg-[#101624] p-4 flex items-center justify-center group">
              <img
                src="/images/screen/Gemini_Generated_Image_krr99ukrr99ukrr9 (Edited 4).png"
                alt="Tech Stack Integration diagram"
                className="w-full h-auto object-contain max-h-[300px] select-none pointer-events-none group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right Column: Case Studies Stack */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Case Study 1 */}
            <div
              className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-col sm:flex-row items-center justify-between p-5 gap-5 hover:scale-[1.01] transition-all duration-300 bg-white dark:bg-[#111723]"
            >
              <div className="flex-1 flex flex-col gap-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-pink-500/10 flex items-center justify-center text-[10px] font-bold text-pink-400 border border-pink-500/20">
                    SH
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-gray-400">Nairobi StyleHub</span>
                </div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg sm:text-xl leading-snug">
                  Nairobi StyleHub Boosts Conversions by 22%
                </h4>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md w-max">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Success</span>
                </div>
              </div>
              <div className="w-full sm:w-1/3 aspect-[4/3] rounded-xl overflow-hidden bg-black/10 flex items-center justify-center">
                <img
                  src="/images/screen/Gemini_Generated_Image_krr99ukrr99ukrr9 (Edited 5).png"
                  alt="StyleHub shop case study"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Case Study 2 */}
            <div
              className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md flex flex-col sm:flex-row items-center justify-between p-5 gap-5 hover:scale-[1.01] transition-all duration-300 bg-white dark:bg-[#0f1523]"
            >
              <div className="flex-1 flex flex-col gap-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/20">
                    TS
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-gray-400">Mombasa TechSolutions</span>
                </div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg sm:text-xl leading-snug">
                  Mombasa TechSolutions Achieves 18% Higher ROI
                </h4>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md w-max">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Success</span>
                </div>
              </div>
              <div className="w-full sm:w-1/3 aspect-[4/3] rounded-xl overflow-hidden bg-black/10 flex items-center justify-center">
                <img
                  src="/images/screen/Gemini_Generated_Image_krr99ukrr99ukrr9 (Edited 6).png"
                  alt="TechSolutions case study"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-8 md:mt-16">
          <Link
            to="/login"
            className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center border border-transparent"
          >
            Get Started Now
          </Link>
          <Link
            to="/contact"
            className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center"
          >
            Talk to Our Kenya Team
          </Link>
        </div>
      </div>
    </section>
  );
}
