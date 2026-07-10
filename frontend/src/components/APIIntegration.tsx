import { CheckCircle2, Code2, Blocks, Webhook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const integrationCards = [
  {
    icon: Code2,
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'FULL PLATFORM ACCESS VIA REST API',
    description: 'Comprehensive set of RESTful endpoints',
    src: '/images/scrennn/Gemini_Generated_Image_grjfr7grjfr7grjf (Edited).png',
    type: 'image',
    bgClass: 'bg-white dark:bg-[#18252d]',
    borderClass: 'border-slate-200 dark:border-blue-500/10',
    bullets: [
      'Comprehensive set of RESTful endpoints',
      'Manage contacts & audience segments',
      'Trigger multi-channel campaigns',
      'Access detailed analytics data',
    ],
  },
  {
    icon: Blocks,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'MODERN DEVELOPER TOOLS & SDKs',
    description: 'Officially supported SDKs',
    src: '/images/scrennn/add_micro_animations_and_gener.mp4',
    type: 'video',
    bgClass: 'bg-white dark:bg-[#141e2a]',
    borderClass: 'border-slate-200 dark:border-amber-500/10',
    bullets: [
      'Officially supported SDKs',
      'Live interactive API documentation (OpenAPI/Swagger)',
      'Sandbox environments for testing',
      'Real-time API usage and performance metrics',
    ],
  },
  {
    icon: Webhook,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    title: 'WEBHOOKS & CUSTOM EVENT HANDLING',
    description: 'Configurable webhook endpoints',
    src: '/images/scrennn/add_micro_animations_and_gener (1).mp4',
    type: 'video',
    bgClass: 'bg-white dark:bg-[#131c28]',
    borderClass: 'border-slate-200 dark:border-emerald-500/10',
    bullets: [
      'Configurable webhook endpoints',
      'Event-driven integration',
      'Customize data payloads',
      'Secure authentication for outbound data',
    ],
  },
];



/* ──────────────────────────────────
   BENTO CARD (shared renderer)
   ────────────────────────────────── */
function BentoCard({
  card,
  isHero = false,
  delay = 0,
}: {
  card: (typeof integrationCards)[number];
  isHero?: boolean;
  delay?: number;
  key?: any;
}) {
  const Icon = card.icon;

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl overflow-hidden border shadow-md
        group transition-all duration-500 hover:scale-[1.015] hover:shadow-xl
        ${card.bgClass} ${card.borderClass}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient border shimmer on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10 ring-1 ring-blue-500/20 dark:ring-blue-400/15" />

      {/* Visual Area */}
      {card.title === 'MODERN DEVELOPER TOOLS & SDKs' ? (
        <div className="w-full flex flex-col justify-between p-6 bg-[#161a26]/40 dark:bg-black/10 shrink-0 border-b border-slate-200/50 dark:border-white/5">
          <div className="px-2 mb-4">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Multi-Language SDK Support</h4>
            <p className="text-xs leading-relaxed text-slate-800 dark:text-gray-200 font-medium">
              Integrate Trackom seamlessly using officially supported SDKs for Node.js, Python, Go, PHP, and Java. Get up and running in minutes with native client libraries.
            </p>
          </div>
          <div className="relative w-full aspect-[16/10] md:aspect-auto md:min-h-[160px] overflow-hidden flex items-center justify-center">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            >
              <source src={card.src} type="video/mp4" />
            </video>
          </div>
          <div className="px-2 mt-4 flex flex-col gap-2 items-start">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-blue-400 uppercase tracking-wider">Interactive API Playground</h4>
            <p className="text-xs leading-relaxed text-slate-800 dark:text-gray-200 font-medium">
              Test queries, inspect payloads, and mock responses directly inside our interactive Swagger sandbox before writing production code.
            </p>
            <Link to="/docs" className="h-8 px-4 rounded-full text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center border border-transparent">
              Explore Developer Docs
            </Link>
          </div>
        </div>
      ) : (
        <div
          className={`
            relative w-full overflow-hidden bg-black/10 flex items-center justify-center
            ${isHero ? 'aspect-[16/9] md:aspect-auto md:flex-1 md:min-h-0' : 'aspect-[16/10]'}
          `}
        >
          {card.type === 'video' ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            >
              <source src={card.src} type="video/mp4" />
            </video>
          ) : (
            <img
              src={card.src}
              alt={card.title}
              className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          )}
        </div>
      )}

      {/* Text Content */}
      <div className={`p-5 ${isHero ? 'md:p-6' : ''} flex flex-col gap-3 flex-shrink-0`}>
        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
          </div>
          <h3
            className={`font-display font-bold text-slate-900 dark:text-white leading-snug uppercase tracking-wide ${
              isHero ? 'text-sm lg:text-lg' : 'text-sm lg:text-base'
            }`}
          >
            {card.title}
          </h3>
        </div>

        {/* Checklist */}
        <ul
          className={`flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-white/5 ${
            isHero ? 'md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2' : ''
          }`}
        >
          {card.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-gray-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────── */
export default function APIIntegration() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-[#F3F4FD] dark:bg-[#07070C] py-10 md:py-14 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5 overflow-hidden">
      {/* Background ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.02] blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-3 sm:gap-4 text-center max-w-3xl mx-auto mb-8 md:mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-wide uppercase">
            Developer-Ready API. Built for African Scale.
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Connect Trackom to your existing M-Pesa, ERP, or CRM stack with clean REST endpoints, SDKs, and real-time webhooks.
          </p>
        </div>

        {/* BENTO GRID */}
        <div
          ref={gridRef}
          className={`mb-10 md:mb-20 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
        >
          {/* Desktop bento: 3 cols, hero spans 2 cols + 2 rows */}
          <div className="hidden md:grid md:grid-cols-3 md:grid-rows-2 gap-5 lg:gap-6" style={{ gridTemplateRows: 'auto auto' }}>
            {/* Hero card - col 1-2, row 1-2 (Developer Tools & SDKs) */}
            <div className="md:col-span-2 md:row-span-2 flex" style={{ transitionDelay: '0ms' }}>
              <div className="flex-1 flex">
                <BentoCard card={integrationCards[1]} isHero delay={0} />
              </div>
            </div>

            {/* Top-right card (REST API) */}
            <div className="flex" style={{ transitionDelay: '120ms' }}>
              <BentoCard card={integrationCards[0]} delay={120} />
            </div>

            {/* Bottom-right card (Webhooks) */}
            <div className="flex" style={{ transitionDelay: '240ms' }}>
              <BentoCard card={integrationCards[2]} delay={240} />
            </div>
          </div>

          {/* Mobile stack */}
          <div className="flex flex-col gap-5 md:hidden">
            {integrationCards.map((card, index) => (
              <BentoCard key={card.title} card={card} delay={index * 120} />
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div
          ref={ctaRef}
          className={`flex flex-col gap-6 text-center max-w-3xl mx-auto items-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}
        >
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-wide">
            Ready to Ship Faster?
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <Link
              to="/login"
              className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center border border-transparent"
            >
              Get API Access Free
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center"
            >
              Talk to an Engineer
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
