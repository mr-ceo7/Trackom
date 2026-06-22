import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Hash, Send, ShieldCheck, 
  Smartphone, PhoneCall, Wifi, Globe, 
  Users, ChevronRight
} from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

/* ─── SERVICE CATEGORIES ─── */
const categories = [
  {
    id: 'messaging',
    label: 'Omnichannel Messaging',
    tagline: 'Reach every customer, everywhere',
    services: [
      {
        icon: <MessageSquare className="w-5 h-5" />,
        title: 'Bulk SMS',
        description: 'Broadcast campaigns to millions with AI-optimized copy and concurrent carrier routing.',
      },
      {
        icon: <Send className="w-5 h-5" />,
        title: 'WhatsApp Business API',
        description: 'Rich media messaging at scale — images, documents, buttons, and templates.',
      },
      {
        icon: <MessageSquare className="w-5 h-5" />,
        title: 'Two-Way SMS',
        description: 'Receive and respond to customer messages with automated reply workflows.',
      },
    ],
  },
  {
    id: 'interactive',
    label: 'Interactive & Voice',
    tagline: 'Engage customers in real-time',
    services: [
      {
        icon: <Hash className="w-5 h-5" />,
        title: 'USSD Services',
        description: 'Interactive USSD menus and sessions for surveys, payments, and customer engagement.',
      },
      {
        icon: <Smartphone className="w-5 h-5" />,
        title: 'Shortcodes',
        description: 'Dedicated and shared shortcodes for campaigns, subscriptions, and voting systems.',
      },
      {
        icon: <PhoneCall className="w-5 h-5" />,
        title: 'Voice Calls',
        description: 'Automated voice broadcasting for alerts, reminders, and IVR systems.',
      },
    ],
  },
  {
    id: 'utilities',
    label: 'Verification & Rewards',
    tagline: 'Secure, verify, and reward',
    services: [
      {
        icon: <ShieldCheck className="w-5 h-5" />,
        title: 'OTP Verification',
        description: 'Secure one-time passwords with sub-second delivery and 99.99% reliability.',
      },
      {
        icon: <Wifi className="w-5 h-5" />,
        title: 'Airtime Top-up',
        description: 'Programmatic airtime distribution across all Kenyan networks via API.',
      },
      {
        icon: <Globe className="w-5 h-5" />,
        title: 'Mobile Data Bundles',
        description: 'Data bundle distribution API for loyalty programs and customer rewards.',
      },
    ],
  },
];

/* ─── AUTO-CYCLE DURATION ─── */
const CYCLE_DURATION = 6000; // ms per category

/* ─── SIMULATOR PANELS ─── */

function MessagingSimulator() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      {/* Phone mockup */}
      <div className="relative w-[260px] h-[460px] rounded-[2.5rem] border-2 border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#1a1a2e] shadow-2xl shadow-black/20 overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[10px] font-semibold text-slate-600 dark:text-gray-400">
          <span>9:41</span>
          <div className="w-20 h-5 rounded-full bg-slate-900 dark:bg-black mx-auto" />
          <span>5G</span>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#111128]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-[10px] font-bold">T</div>
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-white">Trackom SMS</div>
            <div className="text-[10px] text-green-500">Online</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
          {/* Incoming message */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="max-w-[85%] bg-brand-primary/10 dark:bg-brand-primary/15 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[11px] text-slate-700 dark:text-gray-200 leading-relaxed">
              🎉 FLASH SALE: Get 20% off this weekend! Use code <span className="font-bold text-brand-primary">FRIDAY20</span> at checkout.
            </div>
            <div className="text-[9px] text-slate-400 dark:text-gray-500 mt-1 ml-1">9:40 AM · Delivered ✓✓</div>
          </div>

          {/* Incoming - WhatsApp style rich */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="max-w-[85%] bg-brand-emerald/10 dark:bg-brand-emerald/15 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[11px] text-slate-700 dark:text-gray-200 leading-relaxed">
              Hi <span className="font-bold">John</span>, your M-Pesa payment of <span className="font-bold text-brand-emerald">KES 2,500</span> is confirmed. Ref: TRK849291 ✅
            </div>
            <div className="text-[9px] text-slate-400 dark:text-gray-500 mt-1 ml-1">9:41 AM · Delivered ✓✓</div>
          </div>

          {/* Outgoing reply */}
          <div className="flex justify-end animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="max-w-[85%] bg-brand-primary rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[11px] text-white leading-relaxed">
              Thanks! 🙏 Order confirmed.
            </div>
          </div>

          {/* Typing indicator */}
          <div className="animate-fade-in" style={{ animationDelay: '1.5s' }}>
            <div className="w-16 bg-slate-200 dark:bg-white/5 rounded-2xl rounded-tl-sm px-3.5 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10">
            <span className="text-[11px] text-slate-400 dark:text-gray-500 flex-1">Type a message...</span>
            <Send className="w-3.5 h-3.5 text-brand-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveSimulator() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      {/* USSD Terminal */}
      <div className="w-full max-w-[320px] rounded-2xl bg-slate-100 dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/8 shadow-2xl shadow-black/20 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-200 dark:bg-[#111128] border-b border-slate-300 dark:border-white/5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <span className="flex-1 text-center text-[10px] font-mono font-semibold text-slate-500 dark:text-gray-500 tracking-wide">USSD SESSION *384*123#</span>
        </div>

        {/* USSD content */}
        <div className="p-4 font-mono text-xs text-slate-700 dark:text-gray-300 space-y-3">
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-brand-primary font-bold text-sm mb-2">Welcome to Trackom</div>
            <div className="text-slate-500 dark:text-gray-400 text-[10px] mb-3">Select an option:</div>
          </div>

          {[
            { num: '1', label: 'Check Balance', status: null },
            { num: '2', label: 'Buy SMS Credits', status: 'selected' },
            { num: '3', label: 'Send Campaign', status: null },
            { num: '4', label: 'Account Settings', status: null },
          ].map((item, i) => (
            <div
              key={item.num}
              className={`animate-fade-in flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                item.status === 'selected'
                  ? 'bg-brand-primary/10 dark:bg-brand-primary/15 border border-brand-primary/30'
                  : 'bg-slate-200/50 dark:bg-white/[0.03] border border-transparent hover:border-slate-300 dark:hover:border-white/10'
              }`}
              style={{ animationDelay: `${0.4 + i * 0.15}s` }}
            >
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                item.status === 'selected' ? 'bg-brand-primary text-white' : 'bg-slate-300 dark:bg-white/10 text-slate-600 dark:text-gray-400'
              }`}>
                {item.num}
              </span>
              <span className={item.status === 'selected' ? 'text-brand-primary font-semibold' : ''}>{item.label}</span>
              {item.status === 'selected' && <ChevronRight className="w-3 h-3 text-brand-primary ml-auto" />}
            </div>
          ))}

          {/* Response */}
          <div className="animate-fade-in border-t border-slate-200 dark:border-white/5 pt-3 mt-3" style={{ animationDelay: '1.2s' }}>
            <div className="text-[10px] text-slate-400 dark:text-gray-500 mb-1">Response:</div>
            <div className="px-3 py-2 rounded-lg bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-[11px]">
              ✓ 10,000 SMS Credits purchased. Balance: 45,200
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilitiesSimulator() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      {/* API Terminal */}
      <div className="w-full max-w-[340px] rounded-2xl bg-slate-100 dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/8 shadow-2xl shadow-black/20 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-200 dark:bg-[#111128] border-b border-slate-300 dark:border-white/5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <span className="flex-1 text-center text-[10px] font-mono font-semibold text-slate-500 dark:text-gray-500 tracking-wide">API RESPONSE LOGS</span>
        </div>

        {/* Log entries */}
        <div className="p-3 font-mono text-[10px] space-y-2 max-h-[360px] overflow-hidden">
          {/* OTP Log */}
          <div className="animate-fade-in rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-3" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-1.5 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald font-bold text-[9px]">200 OK</span>
              <span className="text-slate-400 dark:text-gray-500">POST /v1/otp/send</span>
            </div>
            <pre className="text-slate-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{`{
  "otp_id": "otp_8x4k2m9p",
  "phone": "+254712***678",
  "status": "delivered",
  "delivery_time": "0.8s",
  "expires_in": 300
}`}</pre>
          </div>

          {/* Airtime Log */}
          <div className="animate-fade-in rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-3" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-1.5 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald font-bold text-[9px]">200 OK</span>
              <span className="text-slate-400 dark:text-gray-500">POST /v1/airtime/send</span>
            </div>
            <pre className="text-slate-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{`{
  "txn_id": "air_3f7h9j2k",
  "recipient": "+254798***432",
  "amount": "KES 100",
  "network": "Safaricom",
  "status": "success"
}`}</pre>
          </div>

          {/* Data bundle log */}
          <div className="animate-fade-in rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-3" style={{ animationDelay: '1.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-1.5 py-0.5 rounded bg-brand-primary/15 text-brand-primary font-bold text-[9px]">201 CREATED</span>
              <span className="text-slate-400 dark:text-gray-500">POST /v1/data/bundle</span>
            </div>
            <pre className="text-slate-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{`{
  "bundle_id": "dat_9m2n5p8q",
  "recipient": "+254700***123",
  "bundle": "1.5GB / 7 days",
  "cost": "KES 250",
  "status": "activated"
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const simulators = [MessagingSimulator, InteractiveSimulator, UtilitiesSimulator];

/* ─── MAIN COMPONENT ─── */
export default function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.1 });

  // Auto-cycle
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((i) => (i + 1) % categories.length);
          return 0;
        }
        return prev + (100 / (CYCLE_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleTabClick = useCallback((index: number) => {
    setActiveIndex(index);
    setProgress(0);
  }, []);

  const ActiveSimulator = simulators[activeIndex];
  const activeCategory = categories[activeIndex];

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

      {/* INTERACTIVE LAYOUT */}
      <div
        ref={contentRef}
        className={`scroll-animate ${contentVisible ? 'is-visible' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-6 lg:gap-8">

          {/* LEFT: CATEGORY TABS + SERVICES */}
          <div className="flex flex-col gap-3">
            {categories.map((cat, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleTabClick(index)}
                  className={`group relative w-full text-left rounded-2xl p-5 transition-all duration-400 cursor-pointer border overflow-hidden focus:outline-none ${
                    isActive
                      ? 'bg-white dark:bg-white/[0.04] border-brand-primary/20 shadow-lg shadow-brand-primary/5'
                      : 'bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Progress bar background */}
                  {isActive && (
                    <div
                      className="absolute inset-0 bg-brand-primary/[0.04] dark:bg-brand-primary/[0.06] transition-none"
                      style={{ width: `${progress}%` }}
                    />
                  )}

                  <div className="relative z-10">
                    {/* Category label */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-display font-bold text-sm uppercase tracking-wide transition-colors ${
                        isActive ? 'text-brand-primary' : 'text-slate-700 dark:text-gray-300'
                      }`}>
                        {cat.label}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold tracking-wider transition-colors ${
                        isActive ? 'text-brand-primary' : 'text-slate-400 dark:text-gray-600'
                      }`}>
                        0{index + 1}
                      </span>
                    </div>

                    {/* Tagline */}
                    <p className={`text-xs mb-0 transition-colors ${
                      isActive ? 'text-slate-600 dark:text-gray-400' : 'text-slate-400 dark:text-gray-500'
                    }`}>
                      {cat.tagline}
                    </p>

                    {/* Expanded services list */}
                    <div className={`overflow-hidden transition-all duration-400 ease-out ${
                      isActive ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                    }`}>
                      <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-white/5">
                        {cat.services.map((service) => (
                          <div key={service.title} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                              {service.icon}
                            </div>
                            <div>
                              <div className="font-display font-semibold text-xs text-slate-800 dark:text-white">{service.title}</div>
                              <div className="text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed">{service.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT: LIVE SIMULATOR */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0d0d1a] min-h-[460px] flex items-center justify-center">
            {/* Subtle gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/[0.03] via-transparent to-brand-accent/[0.03] pointer-events-none" />
            
            {/* Simulator label */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald" />
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest">
                Live Preview — {activeCategory.label}
              </span>
            </div>

            {/* Render active simulator */}
            <div className="relative z-10 w-full h-full" key={activeIndex}>
              <ActiveSimulator />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
