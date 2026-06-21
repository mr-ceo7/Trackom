import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const features = [
  {
    type: 'video' as const,
    src: '/videos/animate_it.mp4',
    title: 'Dynamic Automated Journeys',
    description: 'Build triggered sequences based on customer behavior.',
  },
  {
    type: 'image' as const,
    src: '/videos/as2.png',
    title: 'Advanced Audience Segmentation',
    description: 'Target specific segments using real-time data insights.',
  },
  {
    type: 'video' as const,
    src: '/videos/add_micro_animations_and_gener.mp4',
    title: 'Multi-Channel Synergy',
    description: 'Orchestrate seamless campaigns across all channels from one view.',
  },
];

interface FeatureShowcaseProps {
  onOpenSignup: () => void;
}

/* ──────────────────────────────────
   MOBILE DECK OF CARDS
   ────────────────────────────────── */
function MobileDeck({ onOpenSignup }: { onOpenSignup: () => void }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={deckRef} className="md:hidden" style={{ height: '170vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-between pt-14 pb-10 px-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl leading-[1.15] tracking-tight text-balance mb-2">
            Effortless Automation and Personalized Engagement
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
            Scale your reach and boost conversions with sophisticated, data-driven features.
          </p>
        </div>

        {/* Card stack area - vertical card aspect ratio */}
        <div className="relative w-[85vw] max-w-[340px] aspect-[4/5]">
          {features.map((feature, index) => (
            <DeckCard
              key={feature.title}
              feature={feature}
              index={index}
              total={features.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onOpenSignup}
          className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-300"
        >
          See the Platform in Action
        </button>
      </div>
    </div>
  );
}

function DeckCard({
  feature,
  index,
  total,
  scrollYProgress,
}: {
  feature: (typeof features)[number];
  index: number;
  total: number;
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  // Card 0: deals off at [0.42, 0.50]
  // Card 1: deals off at [0.92, 1.00]
  // Card 2: never deals off (stays visible)
  
  const x = useTransform(
    scrollYProgress,
    index === 0 
      ? [0.0, 0.42, 0.50] 
      : index === 1 
        ? [0.0, 0.50, 0.92, 1.0] 
        : [0.0, 1.0],
    index === 0 
      ? [0, 0, -350] 
      : index === 1 
        ? [0, 0, 0, -350] 
        : [0, 0]
  );

  const rotate = useTransform(
    scrollYProgress,
    index === 0 
      ? [0.0, 0.42, 0.50] 
      : index === 1 
        ? [0.0, 0.50, 0.92, 1.0] 
        : [0.0, 1.0],
    index === 0 
      ? [0, 0, -10] 
      : index === 1 
        ? [0, 0, 0, -10] 
        : [0, 0]
  );

  const cardOpacity = useTransform(
    scrollYProgress,
    index === 0 
      ? [0.0, 0.42, 0.50] 
      : index === 1 
        ? [0.0, 0.50, 0.92, 1.0] 
        : [0.0, 1.0],
    index === 0 
      ? [1, 1, 0] 
      : index === 1 
        ? [1, 1, 1, 0] 
        : [1, 1]
  );

  // Stack positions & Scale transitions
  const y = useTransform(
    scrollYProgress,
    index === 0
      ? [0.0, 1.0]
      : index === 1
        ? [0.42, 0.50]
        : [0.42, 0.50, 0.92, 1.0],
    index === 0
      ? [0, 0]
      : index === 1
        ? [6, 0]
        : [12, 6, 6, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    index === 0
      ? [0.0, 1.0]
      : index === 1
        ? [0.42, 0.50]
        : [0.42, 0.50, 0.92, 1.0],
    index === 0
      ? [1.0, 1.0]
      : index === 1
        ? [0.97, 1.0]
        : [0.94, 0.97, 0.97, 1.0]
  );

  const zIndex = total - index;

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden bg-[#0e1422] shadow-xl shadow-black/30 flex flex-col justify-between p-3.5 border border-white/5"
      style={{
        x,
        rotate,
        opacity: cardOpacity,
        zIndex,
        y,
        scale,
      }}
    >
      {/* Visual Asset Container */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
        {feature.type === 'video' ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-contain select-none pointer-events-none"
          >
            <source src={feature.src} type="video/mp4" />
          </video>
        ) : (
          <img
            src={feature.src}
            alt={feature.title}
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        )}
      </div>

      {/* Feature Text Info inside the Card */}
      <div className="pt-3 pb-1 text-center">
        <h3 className="font-display font-bold text-white text-base mb-0.5 leading-tight">
          {feature.title}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed px-1">
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
      {features.map((feature, index) => (
        <div
          key={feature.title}
          className="flex flex-col items-center text-center group"
          style={{ transitionDelay: `${index * 120}ms` }}
        >
          <div className="relative w-full aspect-square max-w-[340px] mx-auto mb-6 rounded-2xl overflow-hidden bg-[#0e1422] shadow-lg shadow-black/20">
            {feature.type === 'video' ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-contain select-none pointer-events-none"
              >
                <source src={feature.src} type="video/mp4" />
              </video>
            ) : (
              <img
                src={feature.src}
                alt={feature.title}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            )}
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
export default function FeatureShowcase({ onOpenSignup }: FeatureShowcaseProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-slate-50 dark:bg-[#0A0A0F] transition-colors duration-300">
      {/* Ambient glow orbs (dark mode only) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-accent/[0.03] blur-[100px]" />
      </div>

      {/* ── DESKTOP ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 hidden md:block pt-14 pb-32">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-4 text-center max-w-3xl mx-auto mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight text-balance">
            Effortless Automation and{' '}
            <br className="hidden sm:block" />
            Personalized Engagement
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Scale your reach and boost conversions with sophisticated, data-driven features.
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
            See the Platform in Action
          </button>
        </div>
      </div>

      {/* ── MOBILE: Deck of Cards ── */}
      <MobileDeck onOpenSignup={onOpenSignup} />
    </section>
  );
}
