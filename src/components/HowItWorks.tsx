import { UserPlus, CreditCard, Rocket } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const steps = [
  {
    number: '01',
    icon: <UserPlus className="w-7 h-7" />,
    title: 'Create Your Account',
    description: 'Sign up in 30 seconds. No credit card required. Get 10,000 free SMS credits instantly.',
    color: 'brand-primary',
  },
  {
    number: '02',
    icon: <CreditCard className="w-7 h-7" />,
    title: 'Load SMS Credits',
    description: 'Top up via M-Pesa, credit card, or bank transfer. Volume discounts applied automatically.',
    color: 'brand-accent',
  },
  {
    number: '03',
    icon: <Rocket className="w-7 h-7" />,
    title: 'Start Sending',
    description: 'Use our dashboard tools with AI copywriter, or integrate via our developer API.',
    color: 'brand-emerald',
  },
];

export default function HowItWorks() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* HEADER */}
      <div
        ref={ref}
        className={`flex flex-col gap-4 text-center max-w-2xl mx-auto mb-20 scroll-animate ${isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-xs uppercase tracking-widest text-brand-primary font-mono font-semibold">
          Get Started in Minutes
        </div>
        <h2 className="font-display font-bold text-white text-3xl md:text-5xl leading-tight">
          Three steps to{' '}
          <span className="gradient-text">launch.</span>
        </h2>
        <p className="text-gray-400 text-base md:text-lg">
          From signup to your first broadcast in under 5 minutes.
        </p>
      </div>

      {/* STEPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-[2px]">
          <div className="w-full h-full bg-gradient-to-r from-brand-primary/30 via-brand-accent/30 to-brand-emerald/30 rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/30 via-brand-accent/30 to-brand-emerald/30 rounded-full blur-sm" />
        </div>

        {steps.map((step, index) => {
          const { ref: stepRef, isVisible: stepVisible } = useScrollAnimation({ threshold: 0.2 });
          return (
            <div
              key={step.number}
              ref={stepRef}
              className={`scroll-animate ${stepVisible ? 'is-visible' : ''} flex flex-col items-center text-center relative`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Number circle */}
              <div className="relative mb-6">
                <div className={`w-[120px] h-[120px] rounded-2xl bg-surface-card border border-white/6 flex items-center justify-center relative group`}>
                  {/* Glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-${step.color}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Number */}
                  <span className="font-display font-bold text-4xl gradient-text">{step.number}</span>
                  
                  {/* Icon badge */}
                  <div className={`absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center text-${step.color}`}>
                    {step.icon}
                  </div>
                </div>
              </div>

              <h3 className="font-display font-semibold text-white text-xl mb-2">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
