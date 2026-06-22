import { CheckCircle2, Code2, Blocks, Webhook } from 'lucide-react';
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

interface APIIntegrationProps {
  onOpenSignup: () => void;
}

export default function APIIntegration({ onOpenSignup }: APIIntegrationProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-[#F3F4FD] dark:bg-[#07070C] py-20 md:py-28 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5 overflow-hidden">
      {/* Background ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.02] blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-4 text-center max-w-3xl mx-auto mb-14 md:mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-wide uppercase">
            Robust & Customizable API Integration
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Extend Trackom's power to your specific infrastructure.
          </p>
        </div>

        {/* 3-COLUMN GRID */}
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
        >
          {integrationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`flex flex-col rounded-2xl overflow-hidden border shadow-md group transition-transform duration-300 hover:scale-[1.02] ${card.bgClass} ${card.borderClass}`}
                style={{
                  transitionDelay: `${index * 120}ms`,
                }}
              >
                {/* Visual Area */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/10 flex items-center justify-center">
                  {card.type === 'video' ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src={card.src} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={card.src}
                      alt={card.title}
                      className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  )}
                </div>

                {/* Text Content */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm lg:text-base leading-snug uppercase tracking-wide">
                      {card.title}
                    </h3>
                  </div>

                  {/* Checklist */}
                  <ul className="flex flex-col gap-2.5 mt-auto pt-3 border-t border-slate-200 dark:border-white/5">
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
          })}
        </div>

        {/* BOTTOM CTA */}
        <div
          ref={ctaRef}
          className={`flex flex-col gap-6 text-center max-w-3xl mx-auto items-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}
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
