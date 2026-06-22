import { Star } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const testimonials = [
  {
    name: 'James Kariuki',
    role: 'CTO',
    company: 'Equity Financial',
    quote: 'Trackom transformed our customer notification system. OTP delivery in under 2 seconds, and their API documentation is the best I\'ve seen.',
    rating: 5,
    initials: 'JK',
  },
  {
    name: 'Sarah Atieno',
    role: 'Head of Marketing',
    company: 'Jumia Kenya',
    quote: 'The AI Copywriter alone increased our SMS campaign click-through rates by 34%. We send over 500K messages monthly through Trackom.',
    rating: 5,
    initials: 'SA',
  },
  {
    name: 'David Mutua',
    role: 'Founder',
    company: 'PayLink Solutions',
    quote: 'As a reseller, Trackom\'s wholesale rates and white-label portal let me build a profitable SMS business from scratch. Incredible support team.',
    rating: 5,
    initials: 'DM',
  },
  {
    name: 'Fatima Hassan',
    role: 'Operations Director',
    company: 'Nairobi Hospital',
    quote: 'Patient appointment reminders via Trackom reduced our no-show rates by 42%. The USSD integration for feedback was a game-changer.',
    rating: 5,
    initials: 'FH',
  },
  {
    name: 'Peter Omondi',
    role: 'Tech Lead',
    company: 'SACCO Connect',
    quote: 'Migrated from Africa\'s Talking to Trackom and saw immediate improvement in delivery rates. The concurrent routing is genuinely faster.',
    rating: 5,
    initials: 'PO',
  },
  {
    name: 'Grace Wanjiku',
    role: 'Digital Manager',
    company: 'KenyaSchools.co.ke',
    quote: 'We use Trackom to send exam results and fee reminders to over 200K parents. The bulk SMS tool with contact segmentation is phenomenal.',
    rating: 5,
    initials: 'GW',
  },
];

export default function Testimonials() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="testimonials" className="py-24 px-4 md:px-8 overflow-hidden scroll-mt-24">
      {/* HEADER */}
      <div
        ref={ref}
        className={`flex flex-col gap-4 text-center max-w-2xl mx-auto mb-16 scroll-animate ${isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-xs uppercase tracking-widest text-brand-accent font-mono font-semibold">
          Trusted by Enterprises
        </div>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl md:text-5xl leading-tight">
          Loved by teams{' '}
          <span className="gradient-text">across Kenya.</span>
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg">
          From banks to hospitals, e-commerce to SACCOs — see why enterprises choose Trackom.
        </p>
      </div>

      {/* SCROLLING TESTIMONIALS MARQUEE */}
      <div className="relative animate-marquee-hover-pause">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 dark:from-surface-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 dark:from-surface-dark to-transparent z-10 pointer-events-none" />

        <div className="flex">
          <div className="animate-marquee flex gap-6 items-stretch" style={{ animationDuration: '40s' }}>
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="glass-card rounded-2xl p-6 w-[340px] shrink-0 flex flex-col justify-between gap-4"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed flex-grow">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-xs font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-slate-900 dark:text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-slate-500 dark:text-gray-500 text-xs">{t.role}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
