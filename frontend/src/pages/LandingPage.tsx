import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import FeatureShowcase from '../components/FeatureShowcase';
import PartnerLogos from '../components/PartnerLogos';
import BulkSMSControl from '../components/BulkSMSControl';
import MarketingFunnel from '../components/MarketingFunnel';
import PlatformCapabilities from '../components/PlatformCapabilities';
import APIIntegration from '../components/APIIntegration';
import ResellerSection from '../components/ResellerSection';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import CTABanner from '../components/CTABanner';
import ParticleCanvas from '../components/ParticleCanvas';
import TrackomLogo from '../components/TrackomLogo';
import SplashScreen from '../components/SplashScreen';
import { Shield, CheckCircle2 } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function LandingPage() {
  usePageTitle({
    title: 'Enterprise Bulk SMS & Communications API',
    description: "Trackom is Kenya's leading enterprise bulk SMS, USSD, WhatsApp Business API, OTP verification, and communications platform. Send smarter, scale faster, deliver instantly.",
    keywords: 'bulk SMS Kenya, SMS API, USSD services, WhatsApp Business API, OTP verification, airtime API, Trackom, enterprise SMS, SMS gateway Kenya'
  });

  const [isAtBottom, setIsAtBottom] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 30; // px threshold from bottom
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
      setIsAtBottom(scrolledToBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initially
    handleScroll();

    // Re-check after a brief timeout to ensure document layout has fully computed
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Handle smooth scroll on mount if page URL contains a hash section indicator
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      // Brief timeout to ensure animations and layout are completed
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(scrollTimer);
    }
  }, []);

  return (
    <>
      <SplashScreen onComplete={() => setLoading(false)} />
      <div className={`min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark selection:bg-brand-primary/30 transition-colors duration-300 relative flex flex-col justify-between font-sans ${
        loading ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100 transition-opacity duration-700 ease-out'
      }`}>
        
        {/* PARTICLE CANVAS BACKGROUND */}
        <ParticleCanvas />

        {/* VIEWPORT GLOW BORDER EFFECT */}
        <div 
          className="fixed inset-x-0 top-0 pointer-events-none z-[9999] viewport-glow-border transition-[bottom] duration-500 ease-out" 
          style={{ bottom: isAtBottom ? '0px' : '-80px' }}
        />

        {/* DOT GRID OVERLAY */}
        <div className="absolute inset-0 dot-grid pointer-events-none z-0" />

        {/* HEADER */}
        <Header />

        {/* MAIN */}
        <main className="flex-grow relative z-10">
          {/* Hero */}
          <Hero />

          {/* Feature Showcase */}
          <FeatureShowcase />

          {/* Partner Logos Marquee */}
          <PartnerLogos />

          {/* Bulk SMS Control Section */}
          <BulkSMSControl />

          {/* Marketing Funnel Section */}
          <MarketingFunnel />

          {/* Detailed Platform Capabilities Section */}
          <PlatformCapabilities />

          {/* API Integration Section */}
          <APIIntegration />

          {/* Reseller Section */}
          <ResellerSection />

          {/* Services Grid */}
          <Services />

          {/* How It Works */}
          <HowItWorks />


          {/* Testimonials */}
          <Testimonials />

          {/* FAQ */}
          <FAQSection />

          {/* Compliance Trust Banner */}
          <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/6">
            <div className="clay-card rounded-3xl p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-left">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-emerald/10 text-brand-emerald font-mono">
                  <Shield className="w-4 h-4" />
                  <span>CA Kenya Compliant • Secure Platform</span>
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white leading-tight">
                  Enterprise-Grade Security. CA Kenya Certified.
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Your data is protected with TLS 1.3 encryption, automated DND compliance per CA Kenya regulations, and real-time fraud prevention across all carrier routes.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0 w-full lg:w-auto font-mono text-xs font-semibold text-slate-500 dark:text-gray-400">
                {['2FA Protected', 'TLS 1.3 Encryption', 'DND Compliant'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <CTABanner />
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
    </>
  );
}
