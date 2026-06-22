import { useRef, useState, useEffect } from 'react';
import { motion, useScroll } from 'motion/react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const controlFeatures = [
  {
    type: 'image' as const,
    src: '/images/ass1.png',
    title: 'Smart Audience Segments',
    description: 'Harness real-time data and behavior to build precise, high-conversion audience groups.',
    bgClass: 'bg-white dark:bg-[#0f1524]',
    borderClass: 'border-slate-200 dark:border-emerald-500/10',
  },
  {
    type: 'image' as const,
    src: '/images/Gemini_Generated_Image_jac908jac908jac9 (Edited 2).png',
    title: 'Integrated Automated Workflows',
    description: 'Create conditional logic flows, trigger SMS from CRM actions, and personalize user journeys.',
    bgClass: 'bg-white dark:bg-[#161d29]',
    borderClass: 'border-slate-200 dark:border-blue-500/10',
  },
  {
    type: 'image' as const,
    src: '/images/Gemini_Generated_Image_jac908jac908jac9 (Edited).png',
    title: 'Deep Analytics & Insights Dashboard',
    description: 'Go beyond delivery stats; track ROI, analyze heatmaps, and optimize message content.',
    bgClass: 'bg-white dark:bg-[#1a2433]',
    borderClass: 'border-slate-200 dark:border-violet-500/10',
  },
];

interface BulkSMSControlProps {
  onOpenSignup: () => void;
}

/* ──────────────────────────────────
   MOBILE DECK OF CARDS
   ────────────────────────────────── */
function MobileDeck({ onOpenSignup }: { onOpenSignup: () => void }) {
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
    <div ref={deckRef} className="md:hidden" style={{ height: '170vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-between pt-14 pb-10 px-4">
        {/* Header */}
        <div className="text-center px-2">
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl leading-[1.15] tracking-tight text-balance mb-2">
            Orchestrate Bulk SMS with Unmatched Control
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
            A robust dashboard and advanced tools built to elevate communication at enterprise scale.
          </p>
        </div>

        {/* Card stack area */}
        <div className="relative w-[85vw] max-w-[340px] aspect-[4/5]">
          {controlFeatures.map((feature, index) => (
            <DeckCard
              key={feature.title}
              feature={feature}
              index={index}
              total={controlFeatures.length}
              activeIndex={activeIndex}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onOpenSignup}
          className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-300"
        >
          Request a Demo
        </button>
      </div>
    </div>
  );
}

function DeckCard({
  feature,
  index,
  total,
  activeIndex,
}: {
  key?: string | number;
  feature: (typeof controlFeatures)[number];
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
      className={`absolute inset-0 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/35 flex flex-col justify-between p-3.5 border ${feature.bgClass} ${feature.borderClass}`}
      style={{
        zIndex,
      }}
      animate={animateState}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Visual Asset Container */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
        <img
          src={feature.src}
          alt={feature.title}
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      </div>

      {/* Feature Text Info inside the Card */}
      <div className="pt-3 pb-1 text-center">
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-0.5 leading-tight">
          {feature.title}
        </h3>
        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed px-1">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────
   DESKTOP 3-COLUMN GRID
   ────────────────────────────────── */
function DesktopGrid() {
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={gridRef}
      className={`hidden md:grid grid-cols-3 gap-6 lg:gap-10 mb-14 md:mb-16 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
    >
      {controlFeatures.map((feature, index) => (
        <div
          key={feature.title}
          className="flex flex-col items-center text-center group"
          style={{ transitionDelay: `${index * 120}ms` }}
        >
          <div
            className={`relative w-full aspect-square max-w-[340px] mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 border transition-transform duration-300 group-hover:scale-[1.02] ${feature.bgClass} ${feature.borderClass}`}
          >
            <img
              src={feature.src}
              alt={feature.title}
              className="w-full h-full object-contain select-none pointer-events-none"
            />
          </div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg md:text-xl mb-2 leading-tight">
            {feature.title}
          </h3>
          <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed max-w-[280px]">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────── */
export default function BulkSMSControl({ onOpenSignup }: BulkSMSControlProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-[#E8ECF9] dark:bg-[#0A0A0F] py-20 md:py-28 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5">
      {/* Ambient glow orbs (dark mode only) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-brand-primary/[0.03] blur-[110px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] rounded-full bg-brand-accent/[0.03] blur-[110px]" />
      </div>

      {/* ── DESKTOP ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 hidden md:block">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-4 text-center max-w-3xl mx-auto mb-16 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight text-balance">
            Orchestrate Bulk SMS with <br className="hidden sm:block" />
            Unmatched Control
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            A robust dashboard and advanced tools built to elevate communication at enterprise scale.
          </p>
        </div>

        <DesktopGrid />

        {/* CTA */}
        <div
          ref={ctaRef}
          className={`flex justify-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}
        >
          <button
            onClick={onOpenSignup}
            className="px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none"
          >
            Request a Demo
          </button>
        </div>
      </div>

      {/* ── MOBILE: Deck of Cards ── */}
      <MobileDeck onOpenSignup={onOpenSignup} />
    </section>
  );
}
