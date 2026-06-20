import { useState } from 'react';
import { Check, Star, Zap, Building2, Users } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const tiers = [
  {
    name: 'Starter',
    price: '0.80',
    description: 'Perfect for small businesses getting started with SMS marketing.',
    volume: 'Up to 50K SMS/month',
    features: [
      'Bulk SMS campaigns',
      'Basic AI Copywriter',
      'REST API access',
      'Contact management',
      'Delivery reports',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
    icon: <Zap className="w-5 h-5" />,
  },
  {
    name: 'Growth',
    price: '0.60',
    description: 'For growing businesses that need advanced tools and higher volumes.',
    volume: 'Up to 500K SMS/month',
    features: [
      'Everything in Starter',
      'Advanced AI Copywriter',
      'REST API + SDK access',
      'WhatsApp Business API',
      'USSD services',
      'Campaign analytics',
      'Webhook integrations',
      'Priority support',
    ],
    cta: 'Get Started',
    popular: true,
    icon: <Star className="w-5 h-5" />,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom requirements and dedicated support.',
    volume: 'Unlimited volume',
    features: [
      'Everything in Growth',
      'Full AI suite',
      'Custom API + Webhooks',
      'Dedicated carrier routes',
      'OTP verification',
      'Voice & data bundles',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
    icon: <Building2 className="w-5 h-5" />,
  },
];

export default function Pricing() {
  const [showKES, setShowKES] = useState(true);
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="pricing" className="py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* HEADER */}
      <div
        ref={ref}
        className={`flex flex-col gap-4 text-center max-w-2xl mx-auto mb-16 scroll-animate ${isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-xs uppercase tracking-widest text-brand-primary font-mono font-semibold">
          Transparent Pricing
        </div>
        <h2 className="font-display font-bold text-white text-3xl md:text-5xl leading-tight">
          Simple pricing,{' '}
          <span className="gradient-text">powerful results.</span>
        </h2>
        <p className="text-gray-400 text-base md:text-lg">
          Volume-based discounts applied automatically. Pay via M-Pesa, no hidden fees.
        </p>

        {/* Currency toggle */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className={`text-sm font-medium ${showKES ? 'text-white' : 'text-gray-500'}`}>KES</span>
          <button
            onClick={() => setShowKES(!showKES)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
              showKES ? 'bg-brand-primary/30' : 'bg-brand-primary/30'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-brand-primary transition-transform duration-300 ${
              showKES ? 'left-0.5' : 'left-6'
            }`} />
          </button>
          <span className={`text-sm font-medium ${!showKES ? 'text-white' : 'text-gray-500'}`}>USD</span>
        </div>
      </div>

      {/* PRICING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tiers.map((tier, index) => {
          const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({ threshold: 0.1 });
          const displayPrice = tier.price === 'Custom' 
            ? 'Custom' 
            : showKES 
              ? `KES ${tier.price}` 
              : `$${(parseFloat(tier.price) / 130).toFixed(4)}`;

          return (
            <div
              key={tier.name}
              ref={cardRef}
              className={`scroll-animate ${cardVisible ? 'is-visible' : ''}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div
                className={`glass-card rounded-2xl p-8 h-full flex flex-col relative overflow-hidden ${
                  tier.popular ? 'border-brand-primary/30 ring-1 ring-brand-primary/10' : ''
                }`}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-6 px-4 py-1 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-b-lg">
                    Most Popular
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tier.popular ? 'bg-brand-primary/15 text-brand-primary-light' : 'bg-white/5 text-gray-400'
                  }`}>
                    {tier.icon}
                  </div>
                  <h3 className="font-display font-semibold text-white text-xl">{tier.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="font-display font-bold text-4xl text-white">{displayPrice}</span>
                  {tier.price !== 'Custom' && (
                    <span className="text-gray-500 text-sm ml-1">/SMS</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mb-1 font-medium">{tier.volume}</p>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                        tier.popular ? 'text-brand-primary-light' : 'text-brand-emerald'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    tier.popular
                      ? 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-lg shadow-brand-primary/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RESELLER CALLOUT */}
      <div className={`scroll-animate ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '400ms' }}>
        <div className="glass-card rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-brand-accent/20">
          <div className="flex items-start gap-4 max-w-xl">
            <div className="w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-xl mb-1">Become a Trackom Reseller</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Purchase wholesale bulk SMS at discounted rates and sell to your own clients. 
                Get your own branded portal, flexible pricing, and dedicated support.
              </p>
            </div>
          </div>
          <button className="shrink-0 px-8 py-3.5 rounded-xl text-sm font-semibold bg-brand-accent hover:bg-brand-accent-hover text-white cursor-pointer shadow-lg shadow-brand-accent/20 transition-all duration-300 hover:scale-[1.02] active:scale-95">
            Apply for Reseller Account
          </button>
        </div>
      </div>
    </section>
  );
}
