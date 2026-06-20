import { 
  MessageSquare, Hash, Send, ShieldCheck, 
  Smartphone, PhoneCall, Wifi, Globe, 
  Users 
} from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation';
import { Service } from '../types';

const services: Service[] = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    image: '/images/chat_bubbles_3d.png?v=2',
    title: 'Bulk SMS',
    description: 'Broadcast campaigns to millions with AI-optimized copy and concurrent carrier routing.',
    color: 'brand-primary',
    featured: true,
  },
  {
    icon: <Hash className="w-6 h-6" />,
    title: 'USSD Services',
    description: 'Interactive USSD menus and sessions for surveys, payments, and customer engagement.',
    color: 'brand-accent',
  },
  {
    icon: <Send className="w-6 h-6" />,
    title: 'WhatsApp Business API',
    description: 'Rich media messaging at scale — images, documents, buttons, and templates.',
    color: 'brand-emerald',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'OTP Verification',
    description: 'Secure one-time passwords with sub-second delivery and 99.99% reliability.',
    color: 'brand-primary',
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Shortcodes',
    description: 'Dedicated and shared shortcodes for campaigns, subscriptions, and voting systems.',
    color: 'brand-accent',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Two-Way SMS',
    description: 'Receive and respond to customer messages with automated reply workflows.',
    color: 'brand-primary',
  },
  {
    icon: <Wifi className="w-6 h-6" />,
    title: 'Airtime Top-up',
    description: 'Programmatic airtime distribution across all Kenyan networks via API.',
    color: 'brand-emerald',
  },
  {
    icon: <PhoneCall className="w-6 h-6" />,
    title: 'Voice Calls',
    description: 'Automated voice broadcasting for alerts, reminders, and IVR systems.',
    color: 'brand-accent',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Mobile Data Bundles',
    description: 'Data bundle distribution API for loyalty programs and customer rewards.',
    color: 'brand-primary',
  },
  {
    icon: <Users className="w-6 h-6" />,
    image: '/images/analytics_envelope_3d.png?v=2',
    title: 'Reseller Platform',
    description: 'White-label wholesale SMS portal. Buy at wholesale rates, sell to your own clients.',
    color: 'brand-accent',
    featured: true,
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  'brand-primary': {
    bg: 'bg-brand-primary/10',
    text: 'text-brand-primary',
    border: 'group-hover:border-brand-primary/30',
  },
  'brand-accent': {
    bg: 'bg-brand-accent/10',
    text: 'text-brand-accent',
    border: 'group-hover:border-brand-accent/30',
  },
  'brand-emerald': {
    bg: 'bg-brand-emerald/10',
    text: 'text-brand-emerald',
    border: 'group-hover:border-brand-emerald/30',
  },
};

export default function Services() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible, getDelay } = useStaggerAnimation(services.length, 80);

  return (
    <section id="services" className="py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* SECTION HEADER */}
      <div
        ref={headerRef}
        className={`flex flex-col gap-4 text-center max-w-2xl mx-auto mb-16 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
      >
        <div className="text-xs uppercase tracking-widest text-brand-accent font-mono font-semibold">
          Complete Communications Suite
        </div>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl md:text-5xl leading-tight">
          Everything you need to{' '}
          <span className="gradient-text">connect & convert.</span>
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg">
          From bulk SMS to WhatsApp, USSD to voice — one platform for all your enterprise communication needs.
        </p>
      </div>

      {/* SERVICES BENTO GRID */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      >
        {services.map((service, index) => {
          const colors = colorMap[service.color];
          return (
            <div
              key={service.title}
              className={`scroll-animate ${gridVisible ? 'is-visible' : ''} ${
                service.featured ? 'sm:col-span-2 lg:col-span-1 xl:col-span-1' : ''
              }`}
              style={getDelay(index)}
            >
              <div
                className={`group glass-card rounded-xl p-6 h-full flex flex-col gap-4 cursor-default ${colors.border}`}
              >
                {/* Icon or 3D Image */}
                <div className="relative">
                  {service.image ? (
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110 select-none pointer-events-none" 
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      {service.icon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white text-base mb-1.5 flex items-center gap-2">
                    {service.title}
                    {service.featured && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-brand-primary/15 text-brand-primary-light">
                        Popular
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
