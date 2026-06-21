import { CheckCircle2, UserPlus, DollarSign, Briefcase } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const resellerCards = [
  {
    icon: UserPlus,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'SIMPLE RESELLER ONBOARDING',
    src: '/images/screennnn/Gemini_Generated_Image_z6efx3z6efx3z6ef (Edited).png',
    bg: '#161a26',
    bullets: [
      'Quick & easy sign-up process.',
      'Rapid reseller account approval.',
      'Dedicated reseller portal access.',
      'Instant account setup.',
    ],
  },
  {
    icon: DollarSign,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'WHOLESALE BULK SMS PRICING',
    src: '/images/screennnn/Gemini_Generated_Image_z6efx3z6efx3z6ef (Edited 2).png',
    bg: '#192134',
    bullets: [
      'Deeply discounted wholesale rates.',
      'Volume-based tiered pricing model.',
      'Purchase credits in bulk.',
      'Real-time credit balance monitoring.',
    ],
  },
  {
    icon: Briefcase,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    title: 'WHITE-LABEL CLIENT MANAGEMENT',
    src: '/images/screennnn/Gemini_Generated_Image_z6efx3z6efx3z6ef (Edited 3).png',
    bg: '#282e3e',
    bullets: [
      'White-label customization with your brand.',
      'Branded client login interface.',
      'Manage client pricing and credits.',
      'Integrated billing and reporting.',
    ],
  },
];

interface ResellerSectionProps {
  onOpenSignup: () => void;
}

export default function ResellerSection({ onOpenSignup }: ResellerSectionProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-white dark:bg-[#07070C] py-20 md:py-28 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5 overflow-hidden">
      {/* Background ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.015] blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-4 text-center max-w-3xl mx-auto mb-14 md:mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-wide uppercase">
            Become a Bulk SMS Reseller
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Register, buy wholesale bulk SMS, and manage your own clients to build a profitable business.
          </p>
        </div>

        {/* 3-COLUMN GRID */}
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
        >
          {resellerCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex flex-col rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-md group transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: card.bg,
                  transitionDelay: `${index * 120}ms`,
                }}
              >
                {/* Visual Area */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/10 flex items-center justify-center">
                  <img
                    src={card.src}
                    alt={card.title}
                    className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                {/* Text Content */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-display font-bold text-white text-sm lg:text-base leading-snug uppercase tracking-wide">
                      {card.title}
                    </h3>
                  </div>

                  {/* Checklist */}
                  <ul className="flex flex-col gap-2.5 mt-auto pt-3 border-t border-white/5">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-xs text-gray-300">
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
