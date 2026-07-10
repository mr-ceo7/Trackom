import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function CTABanner() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-8 md:py-14 px-4 md:px-8 max-w-7xl mx-auto">
      <div
        ref={ref}
        className={`scroll-animate-scale ${isVisible ? 'is-visible' : ''}`}
      >
        <div className="relative rounded-3xl overflow-hidden">
          {/* Video background */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/videos/brand-advert-1.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/80 to-brand-accent/70" />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-5 sm:px-8 md:px-16 py-10 sm:py-14 md:py-20 flex flex-col items-center text-center">
            <h2 className="font-display font-bold text-white text-2xl sm:text-3xl md:text-5xl leading-tight mb-3 sm:mb-4 max-w-2xl text-balance">
              Ready to reach every customer in Kenya?
            </h2>
            <p className="text-white/80 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-lg">
              Join 5,000+ businesses already sending millions of messages monthly. Start free with 10,000 SMS credits - no card required.
            </p>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-brand-primary bg-white hover:bg-gray-100 cursor-pointer shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <span>Start Sending Free</span>
              <Rocket className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
