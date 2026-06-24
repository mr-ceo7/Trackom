import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'motion/react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const features = [
  {
    type: 'video' as const,
    src: '/videos/animate_it.mp4',
    title: 'Dynamic Automated Journeys',
    description: 'Build triggered sequences based on customer behavior — from M-Pesa payment confirmations to appointment reminders.',
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

interface FeatureShowcaseProps {
  onOpenSignup: () => void;
}

/* ──────────────────────────────────
   MOBILE DECK OF CARDS
   ────────────────────────────────── */
function MobileDeck({ onOpenSignup }: { onOpenSignup: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => { handleNext(); }, 3500);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="md:hidden py-16 px-4 flex flex-col items-center gap-8 bg-[#E8ECF9] dark:bg-[#0A0A0F] transition-colors duration-300">
      <div className="text-center max-w-sm">
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl leading-[1.15] tracking-tight text-balance mb-2">
          Automate Campaigns. Personalize Every Message.
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
          From M-Pesa payment confirmations to flash sale alerts — build data-driven customer journeys that convert.
        </p>
      </div>

      <div className="relative w-[85vw] max-w-[340px] aspect-[4/5] my-2">
        {features.map((feature, index) => (
          <DeckCard key={feature.title} feature={feature} index={index} total={features.length} activeIndex={activeIndex} onNext={handleNext} onPrev={handlePrev} setIsPaused={setIsPaused} />
        ))}
      </div>

      <button onClick={onOpenSignup} className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-300 z-10">
        Start Your Free Trial
      </button>
    </div>
  );
}

function DeckCard({ feature, index, total, activeIndex, onNext, onPrev, setIsPaused }: {
  key?: string | number; feature: (typeof features)[number]; index: number; total: number; activeIndex: number; onNext: () => void; onPrev: () => void; setIsPaused: (p: boolean) => void;
}) {
  const isDealt = index < activeIndex;
  const isActive = index === activeIndex;
  const positionInStack = index - activeIndex;

  const animateState = isDealt
    ? { x: -350, rotate: -10, opacity: 0, y: 0, scale: 1 }
    : isActive ? { x: 0, rotate: 0, opacity: 1, y: 0, scale: 1 }
    : { x: 0, rotate: 0, opacity: 1, y: positionInStack * 6, scale: 1 - positionInStack * 0.03 };

  return (
    <motion.div
      className={`absolute inset-0 rounded-2xl overflow-hidden bg-white dark:bg-[#0e1422] shadow-xl shadow-slate-200/50 dark:shadow-black/30 flex flex-col justify-between p-3.5 border border-slate-200 dark:border-white/5 ${isActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      animate={animateState} transition={{ duration: 0.45, ease: 'easeOut' }} style={{ zIndex: total - index }}
      drag={isActive ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6}
      onDragStart={() => setIsPaused(true)}
      onDragEnd={(event, info) => { setIsPaused(false); if (info.offset.x < -55) onNext(); else if (info.offset.x > 55) onPrev(); }}
      onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}
      onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative flex-1 w-full overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
        {feature.type === 'video' ? (
          <video autoPlay muted loop playsInline className="w-full h-full object-contain select-none pointer-events-none"><source src={feature.src} type="video/mp4" /></video>
        ) : (
          <img src={feature.src} alt={feature.title} className="w-full h-full object-contain select-none pointer-events-none" />
        )}
      </div>
      <div className="pt-3 pb-1 text-center">
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-0.5 leading-tight">{feature.title}</h3>
        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed px-1">{feature.description}</p>
      </div>
    </motion.div>
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
        {/* Hero card — col 1-2, row 1-2 */}
        <div className="md:col-span-2 md:row-span-2 flex">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-blue-500/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 group hover:scale-[1.01] transition-transform duration-500">
            <div className="p-8 pb-5">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl md:text-2xl lg:text-3xl mb-3 leading-tight">{features[0].title}</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">{features[0].description}</p>
            </div>
            <div className="relative flex-1 min-h-[300px] overflow-hidden flex items-center justify-center bg-black/10">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-700">
                <source src={features[0].src} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

        {/* Top-right card */}
        <div className="flex">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-emerald-500/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 group hover:scale-[1.02] transition-transform duration-300">
            <div className="p-6 pb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg md:text-xl mb-2 leading-tight">{features[1].title}</h3>
              <p className="text-slate-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed">{features[1].description}</p>
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
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg md:text-xl mb-2 leading-tight">{features[2].title}</h3>
              <p className="text-slate-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed">{features[2].description}</p>
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
export default function FeatureShowcase({ onOpenSignup }: FeatureShowcaseProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-[#E8ECF9] dark:bg-[#0A0A0F] transition-colors duration-300">
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
            From M-Pesa payment confirmations to flash sale alerts — build data-driven customer journeys that convert across Kenya's mobile-first market.
          </p>
        </div>

        <DesktopBentoGrid />

        <div ref={ctaRef} className={`flex justify-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}>
          <button onClick={onOpenSignup} className="px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none">
            Start Your Free Trial
          </button>
        </div>
      </div>

      <MobileDeck onOpenSignup={onOpenSignup} />
    </section>
  );
}
