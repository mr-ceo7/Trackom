import { CheckCircle2, UserPlus, DollarSign, Briefcase } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function ResellerSection({ onOpenSignup }: { onOpenSignup: () => void }) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-[#F3F4FD] dark:bg-[#07070C] py-20 md:py-28 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5 overflow-hidden">
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

        {/* BENTO GRID */}
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
        >
          {/* Card 1: SIMPLE RESELLER ONBOARDING (Vertical, 1 Column span) */}
          <div
            className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md bg-white dark:bg-[#161a26] group transition-transform duration-300 hover:scale-[1.02] md:col-span-1"
          >
            {/* Visual Area */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/10 flex items-center justify-center">
              <img
                src="/images/screennnn/Gemini_Generated_Image_z6efx3z6efx3z6ef (Edited).png"
                alt="Reseller Onboarding"
                className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Text Content */}
            <div className="p-6 flex flex-col gap-4 flex-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <UserPlus className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm lg:text-base leading-snug uppercase tracking-wide">
                  Simple Reseller Onboarding
                </h3>
              </div>

              <ul className="flex flex-col gap-2.5 mt-auto pt-3 border-t border-slate-200 dark:border-white/5">
                {[
                  'Quick & easy sign-up process.',
                  'Rapid reseller account approval.',
                  'Dedicated reseller portal access.',
                  'Instant account setup.',
                ].map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card 2: WHITE-LABEL CLIENT MANAGEMENT (Horizontal on desktop, 2 Columns span) */}
          <div
            className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md bg-white dark:bg-[#282e3e] group transition-transform duration-300 hover:scale-[1.02] md:col-span-2"
          >
            {/* Text Content */}
            <div className="p-6 flex flex-col gap-4 flex-1 justify-center">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm lg:text-base leading-snug uppercase tracking-wide">
                  White-Label Client Management
                </h3>
              </div>

              <ul className="flex flex-col gap-2.5 mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
                {[
                  'White-label customization with your brand.',
                  'Branded client login interface.',
                  'Manage client pricing and credits.',
                  'Integrated billing and reporting.',
                ].map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Area */}
            <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden bg-black/10 flex items-center justify-center shrink-0">
              <img
                src="/images/screennnn/Gemini_Generated_Image_z6efx3z6efx3z6ef (Edited 3).png"
                alt="White-Label Client Management"
                className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 3: WHOLESALE BULK SMS PRICING (Horizontal full-width card, 3 Columns span) */}
          <div
            className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md bg-white dark:bg-[#192134] group transition-transform duration-300 hover:scale-[1.02] md:col-span-3"
          >
            {/* Visual Area */}
            <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden bg-black/10 flex items-center justify-center shrink-0">
              <img
                src="/images/screennnn/Gemini_Generated_Image_z6efx3z6efx3z6ef (Edited 2).png"
                alt="Wholesale Pricing"
                className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Text Content */}
            <div className="p-6 flex flex-col gap-4 flex-1 justify-center">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <DollarSign className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm lg:text-base leading-snug uppercase tracking-wide">
                  Wholesale Bulk SMS Pricing
                </h3>
              </div>

              <ul className="flex flex-col gap-2.5 mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
                {[
                  'Deeply discounted wholesale rates.',
                  'Volume-based tiered pricing model.',
                  'Purchase credits in bulk.',
                  'Real-time credit balance monitoring.',
                ].map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
