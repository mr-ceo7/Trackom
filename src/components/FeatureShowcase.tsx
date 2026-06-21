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

export default function FeatureShowcase({ onOpenSignup }: FeatureShowcaseProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative pt-10 md:pt-14 pb-24 md:pb-32 bg-slate-50 dark:bg-[#0A0A0F] transition-colors duration-300 overflow-hidden">
      {/* Ambient glow orbs (dark mode only) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-accent/[0.03] blur-[100px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-4 text-center max-w-3xl mx-auto mb-16 md:mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
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

        {/* 3-COLUMN FEATURE GRID */}
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 mb-14 md:mb-16 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center group"
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {/* ASSET CARD — dark bg matching the asset backgrounds */}
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

              {/* TEXT */}
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg md:text-xl mb-2 leading-tight">
                {feature.title}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed max-w-[280px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA BUTTON */}
        <div
          ref={ctaRef}
          className={`flex justify-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}
        >
          <button
            onClick={onOpenSignup}
            className="px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center gap-2.5"
          >
            See the Platform in Action
          </button>
        </div>
      </div>
    </section>
  );
}
