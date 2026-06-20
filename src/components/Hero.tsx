import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Rocket, ChevronDown, Play, CheckCircle, Send, Cpu, Users } from 'lucide-react';

interface HeroProps {
  onOpenSignup: () => void;
}

export default function Hero({ onOpenSignup }: HeroProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const [deliverability, setDeliverability] = useState(0);
  const [messages, setMessages] = useState(0);
  const [latency, setLatency] = useState(300);
  const [clients, setClients] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const duration = 2000;

    const updateCounters = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDeliverability(ease * 99.99);
      setMessages(Math.floor(ease * 15.4));
      setLatency(Math.max(30, 180 - Math.floor(ease * 150)));
      setClients(Math.floor(ease * 5000));

      if (progress < 1) requestAnimationFrame(updateCounters);
    };

    requestAnimationFrame(updateCounters);
  }, [isInView]);

  const stats = [
    {
      value: `${deliverability.toFixed(2)}%`,
      label: 'Delivery Rate',
      description: 'Smart carrier routing avoids spam filters.',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'emerald',
    },
    {
      value: `${messages.toFixed(1)}M+`,
      label: 'SMS Sent',
      description: 'Powering campaigns across Kenya daily.',
      icon: <Send className="w-5 h-5" />,
      color: 'blue',
    },
    {
      value: `< ${latency}ms`,
      label: 'API Latency',
      description: 'Concurrent channels execute in parallel.',
      icon: <Cpu className="w-5 h-5" />,
      color: 'cyan',
    },
    {
      value: `${clients.toLocaleString()}+`,
      label: 'Enterprise Clients',
      description: 'Leading brands trust our infrastructure.',
      icon: <Users className="w-5 h-5" />,
      color: 'indigo',
    },
  ];

  return (
    <div id="top-page" className="relative min-h-screen flex flex-col bg-[#0A0A0F]">
      
      {/* HERO MAIN ROW */}
      <div 
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center px-4 md:px-8 pt-28 lg:pt-20 pb-16 overflow-hidden animate-fade-in"
      >
        {/* VIDEO BACKGROUND RESTRICTED TO RIGHT SIDE WITHOUT SHRINKING */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[50%] z-0 pointer-events-none select-none overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-[85%_center] opacity-95"
          >
            <source src="/videos/animate_the_d_assets_in_place.mp4" type="video/mp4" />
          </video>
          {/* Subtle horizontal mask to blend video edges */}
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#0A0A0F] to-transparent pointer-events-none" />
        </div>

        {/* READABILITY GRADIENT OVERLAY */}
        <div className="absolute inset-0 z-[1] pointer-events-none select-none bg-gradient-to-r from-[#0A0A0F] via-[#0A0A0F]/65 to-transparent" />

        {/* AMBIENT GLOWS BEHIND TEXT */}
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-brand-primary/10 blur-[100px] animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* LEFT COLUMN: BRANDING, HEADLINE, CTAS */}
          <div className="lg:col-span-7 flex flex-col text-left items-start">
            
            {/* BADGE */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold text-gray-300 mb-6 cursor-default select-none border border-white/10"
            >
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase">
                <span className="text-sm">🇰🇪</span>
                <span>Kenya's #1 Enterprise Communications Platform</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
            </motion.div>

            {/* HEADLINE */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display font-extrabold text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tighter text-balance"
            >
              The Ultimate Bulk <br />
              <span className="text-white">SMS Platform</span>
            </motion.h1>

            {/* SUBTITLE */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-300 text-base sm:text-lg md:text-xl font-medium max-w-xl mt-6 leading-relaxed text-balance"
            >
              Broadcast campaigns to millions with AI-optimized copy, real-time smart routing, 
              instant M-Pesa top-ups, and sub-second delivery verification.
            </motion.p>

            {/* CTA BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto font-sans"
            >
              <button
                onClick={onOpenSignup}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center gap-2.5"
              >
                <span>Get Started</span>
                <Rocket className="w-4 h-4" />
              </button>

              <a
                href="#api-docs"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('api-docs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-98 transition-all duration-300 flex items-center justify-center gap-2.5 focus:outline-none backdrop-blur-sm"
              >
                <span>Learn More</span>
              </a>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: SPACER FOR THE PRE-RENDERED 3D ASSETS IN THE VIDEO */}
          <div className="lg:col-span-5 h-[280px] sm:h-[350px] lg:h-full pointer-events-none" />

        </div>
      </div>

      {/* STATS SECTION AT THE BOTTOM */}
      <div className="w-full bg-slate-50 dark:bg-[#0B0B12] border-t border-slate-200/60 dark:border-white/5 py-12 px-4 md:px-8 relative z-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md dark:hover:border-brand-primary/20 flex flex-col items-start gap-4 transition-all duration-300"
              >
                {/* ICON BOX - TOP LEFT */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-600 dark:bg-white/5 dark:text-gray-300">
                  {stat.icon}
                </div>
                
                {/* VALUES & LABELS STACKED */}
                <div className="flex flex-col gap-1.5">
                  <div className="font-display font-extrabold text-slate-900 dark:text-white text-3xl tracking-tight leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-gray-200 tracking-tight">
                    {stat.label}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-normal mt-0.5">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
