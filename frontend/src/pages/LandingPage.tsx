import { useState, useEffect } from 'react';
import Header from '../components/Header';
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
import SignupModal from '../components/SignupModal';
import ParticleCanvas from '../components/ParticleCanvas';
import TrackomLogo from '../components/TrackomLogo';
import { Shield, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

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
    <div className="min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark selection:bg-brand-primary/30 transition-colors duration-300 relative flex flex-col justify-between font-sans">
      
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
      <Header onOpenSignup={() => setIsSignupOpen(true)} />

      {/* MAIN */}
      <main className="flex-grow relative z-10">
        {/* Hero */}
        <Hero onOpenSignup={() => setIsSignupOpen(true)} />

        {/* Feature Showcase */}
        <FeatureShowcase onOpenSignup={() => setIsSignupOpen(true)} />

        {/* Partner Logos Marquee */}
        <PartnerLogos />

        {/* Bulk SMS Control Section */}
        <BulkSMSControl onOpenSignup={() => setIsSignupOpen(true)} />

        {/* Marketing Funnel Section */}
        <MarketingFunnel onOpenSignup={() => setIsSignupOpen(true)} />

        {/* Detailed Platform Capabilities Section */}
        <PlatformCapabilities onOpenSignup={() => setIsSignupOpen(true)} />

        {/* API Integration Section */}
        <APIIntegration onOpenSignup={() => setIsSignupOpen(true)} />

        {/* Reseller Section */}
        <ResellerSection onOpenSignup={() => setIsSignupOpen(true)} />

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
          <div className="glass-card rounded-2xl p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-left">
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
        <CTABanner onOpenSignup={() => setIsSignupOpen(true)} />
      </main>

      {/* FOOTER */}
      <footer id="contact" className="bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/6 py-16 px-4 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <TrackomLogo size={24} />
            <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed max-w-xs">
              Kenya's leading enterprise communications platform. Bulk SMS, USSD, WhatsApp Business API, OTP, and more.
            </p>
            <div className="flex items-center gap-3 mt-2">
              {/* Social icons */}
              {['X', 'in', 'GH'].map((icon) => (
                <a key={icon} href="#" className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/6 flex items-center justify-center text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs font-bold">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h5 className="font-display font-semibold text-xs uppercase text-slate-700 dark:text-gray-300 tracking-wider mb-4">Products</h5>
            <ul className="space-y-2.5 text-xs text-slate-500 dark:text-gray-500 font-medium">
              {['Bulk SMS', 'USSD Services', 'WhatsApp API', 'OTP Verification', 'Shortcodes', 'Reseller Platform'].map((item) => (
                <li key={item}><a href="#services" className="hover:text-brand-primary-light transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h5 className="font-display font-semibold text-xs uppercase text-slate-700 dark:text-gray-300 tracking-wider mb-4">Developers</h5>
            <ul className="space-y-2.5 text-xs text-slate-500 dark:text-gray-500 font-medium">
              {['REST API Docs', 'Node.js SDK', 'Python SDK', 'PHP SDK', 'Webhooks', 'Sandbox'].map((item) => (
                <li key={item}><a href="#api-docs" className="hover:text-brand-primary-light transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-4">
            <h5 className="font-display font-semibold text-xs uppercase text-slate-700 dark:text-gray-300 tracking-wider">Platform Status</h5>
            
            <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-white/[0.01] w-fit font-mono text-[10px] font-semibold text-brand-emerald">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald" />
              </span>
              <span>ALL SYSTEMS OPERATIONAL</span>
            </div>
            
            <span className="text-[10px] text-slate-500 dark:text-gray-500 leading-normal font-medium uppercase tracking-widest font-display">
              © 2026 Trackom Group. All rights reserved.
            </span>
            <span className="text-[10px] text-slate-400 dark:text-gray-600">
              trackomgroup.com
            </span>
          </div>
        </div>
      </footer>

      {/* SIGNUP MODAL */}
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
}
