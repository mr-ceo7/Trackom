import { useRef, useState, useEffect } from 'react';
import { motion, useScroll } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const capabilityCards = [
  {
    src: '/images/screenn/Gemini_Generated_Image_o3oecqo3oecqo3oe (Edited).png',
    title: 'VISUAL JOURNEY BUILDER',
    description: 'Visually construct and automate personalized customer paths.',
    bg: '#0f1523',
    border: 'border-blue-500/10',
    checkmarks: [
      'Multi-stage conditional logic',
      'Cross-channel triggers (Email, Push, SMS)',
      'Wait steps & time triggers',
      'Custom webhooks'
    ]
  },
  {
    src: '/images/screenn/Gemini_Generated_Image_o3oecqo3oecqo3oe (Edited 2).png',
    title: 'ADVANCED AUDIENCE INTELLIGENCE',
    description: 'Power segmentation with deep data analysis.',
    bg: '#181f2e',
    border: 'border-emerald-500/10',
    checkmarks: [
      'SQL-level query power',
      'Behavioral event tracking',
      'Demographic & psychographic data',
      'Predictive scoring'
    ]
  },
  {
    src: '/images/screenn/Gemini_Generated_Image_o3oecqo3oecqo3oe (Edited 3).png',
    title: 'REAL-TIME ANALYTICS & REPORTING',
    description: 'Monitor and optimize campaign performance instantly.',
    bg: '#0f1525',
    border: 'border-purple-500/10',
    checkmarks: [
      'Customizable dashboards',
      'Cohort & funnel analysis',
      'A/B test reporting & visualization',
      'Exportable data reports'
    ]
  }
];

interface PlatformCapabilitiesProps {
  onOpenSignup: () => void;
}

/* ──────────────────────────────────
   MOBILE DECK OF CARDS
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
    <div ref={deckRef} className="md:hidden w-full" style={{ height: '170vh' }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-between pt-16 pb-12 px-4">
        {/* Header */}
        <div className="text-center px-2">
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl tracking-wide uppercase mb-2">
            Detailed Platform Capabilities
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed max-w-[280px] mx-auto">
            Explore advanced toolsets engineered to give you complete operational control.
          </p>
        </div>

        {/* Card stack area */}
        <div className="relative w-[85vw] max-w-[340px] aspect-[4/5] my-auto">
          {capabilityCards.map((card, index) => (
            <DeckCard
              key={card.title}
              card={card}
              index={index}
              total={capabilityCards.length}
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
  card: (typeof capabilityCards)[number];
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
      className={`absolute inset-0 rounded-2xl overflow-hidden shadow-xl shadow-black/35 flex flex-col justify-between p-4 border ${card.border}`}
      style={{
        backgroundColor: card.bg,
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
      <div className="pt-3.5 pb-1 flex flex-col gap-2">
        <h3 className="font-display font-bold text-white text-sm tracking-wide uppercase leading-tight">
          {card.title}
        </h3>
        
        {/* Checklist inside the mobile card */}
        <ul className="flex flex-col gap-1.5 text-[11px] text-gray-300 text-left px-1">
          {card.checkmarks.map((check) => (
            <li key={check} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{check}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────
   DESKTOP 3-COLUMN CAPABILITIES GRID
   ────────────────────────────────── */
function DesktopGrid() {
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={gridRef}
      className={`hidden md:grid grid-cols-3 gap-6 lg:gap-8 mb-20 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
    >
      {capabilityCards.map((card, index) => (
        <div
          key={card.title}
          className="flex flex-col rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-md p-5 group transition-transform duration-300 hover:scale-[1.02]"
          style={{
            backgroundColor: card.bg,
            transitionDelay: `${index * 120}ms`
          }}
        >
          {/* Asset Image */}
          <div className="relative w-full aspect-[16/10] mb-5 rounded-xl overflow-hidden bg-black/10 flex items-center justify-center">
            <img
              src={card.src}
              alt={card.title}
              className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

          {/* Heading */}
          <h3 className="font-display font-bold text-white text-base lg:text-lg mb-2 leading-snug uppercase tracking-wide">
            {card.title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-4">
            {card.description}
          </p>

          {/* Checklist */}
          <ul className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-white/5">
            {card.checkmarks.map((check) => (
              <li key={check} className="flex items-start gap-2.5 text-xs text-gray-300">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500 mt-0.5" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────── */
export default function PlatformCapabilities({ onOpenSignup }: PlatformCapabilitiesProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-slate-50 dark:bg-[#0A0A0F] py-20 md:py-28 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5">
      {/* Background ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] rounded-full bg-blue-500/[0.02] blur-[110px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] rounded-full bg-violet-500/[0.02] blur-[110px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER (DESKTOP) */}
        <div
          ref={headerRef}
          className={`hidden md:flex flex-col gap-4 text-center max-w-3xl mx-auto mb-16 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-wide uppercase">
            Detailed Platform Capabilities
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Explore advanced toolsets engineered to give you complete operational control.
          </p>
        </div>

        {/* 1. Desktop Capabilities Cards */}
        <DesktopGrid />

        {/* 2. Mobile Capabilities Deck */}
        <MobileDeck />

        {/* Bottom CTA Block */}
        <div
          ref={ctaRef}
          className={`flex flex-col gap-6 text-center max-w-3xl mx-auto mt-12 md:mt-24 items-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}
        >
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide">
            Ready to Scale Your Business?
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none text-center"
            >
              Start Free Trial
            </button>
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none text-center"
            >
              Talk to a Strategist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
