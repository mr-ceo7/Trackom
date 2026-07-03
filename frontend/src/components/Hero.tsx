import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useScroll, useMotionValueEvent } from 'motion/react';
import { Rocket, CheckCircle, Send, Cpu, Users } from 'lucide-react';

interface HeroProps {
  onOpenSignup: () => void;
}

export default function Hero({ onOpenSignup }: HeroProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const heroSectionRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  const [showFirst, setShowFirst] = useState(true);

  // snappier scroll threshold (100px) triggers the transition instantly
  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowFirst(latest < 500);
  });

  const [deliverability, setDeliverability] = useState(0);
  const [messages, setMessages] = useState(0);
  const [latency, setLatency] = useState(300);
  const [clients, setClients] = useState(0);

  useEffect(() => {
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
      label: 'SMS Delivered Monthly',
      description: 'Trusted by Kenya\'s top enterprises.',
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

  const renderVideoAndOverlay = () => (
    <>
      {/* VIDEO BACKGROUND RESTRICTED TO RIGHT SIDE WITHOUT SHRINKING */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] z-0 pointer-events-none select-none overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-[80%_center] translate-y-24 opacity-85"
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
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-brand-primary/5 blur-[100px] animate-pulse" />
      </div>
    </>
  );

  const renderStats = () => (
    <div className="w-full bg-[#0B0B12] border-t border-white/5 py-4 px-4 md:px-8 relative z-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-surface-card rounded-xl p-4 border border-white/5 shadow-sm hover:shadow-md dark:hover:border-brand-primary/20 flex items-center gap-3 transition-all duration-300"
            >
              {/* ICON */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/5 text-gray-300">
                {stat.icon}
              </div>

              {/* VALUE & LABEL */}
              <div className="flex flex-col min-w-0">
                <div className="font-display font-extrabold text-white text-xl tracking-tight leading-none">
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold text-gray-400 tracking-tight mt-0.5 truncate">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={heroSectionRef} id="top-page" className="relative h-[240vh] bg-[#0A0A0F] transition-colors duration-300">
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden">
        {renderVideoAndOverlay()}

        {/* MAIN CONTENT ROW */}
        <div className="relative flex-grow flex items-start justify-center px-4 md:px-8 pt-28 pb-8">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">

            {/* LEFT COLUMN: TRANSITIONS CONTENT IN-PLACE */}
            <div className="lg:col-span-7 relative h-[280px] sm:h-[320px] lg:h-[380px] w-full">

              {/* SCREEN 1: BRAND LOGO INITIAL VIEW */}
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{
                  opacity: showFirst ? 1 : 0,
                  y: showFirst ? 0 : -30,
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={`absolute inset-0 flex flex-col text-left items-start justify-center ${showFirst ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
              >
                <img
                  src="/Gemini_Generated_Image_8ab5bh8ab5bh8ab5.png"
                  alt="Trackom - The Ultimate Bulk SMS Platform"
                  className="max-w-full h-auto max-h-[180px] lg:max-h-[240px] object-contain ml-0"
                />

                {/* CTA BUTTONS SCREEN 1 */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto font-sans">
                  <button
                    onClick={onOpenSignup}
                    className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center gap-2 border border-transparent"
                  >
                    <span>Get Started Free</span>
                    <Rocket className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onOpenSignup}
                    className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none backdrop-blur-sm shadow-sm"
                  >
                    <span>Book a Demo</span>
                  </button>
                </div>
              </motion.div>

              {/* SCREEN 2: CURRENT HERO WITH DETAILED LIVE TEXT */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: !showFirst ? 1 : 0,
                  y: !showFirst ? 0 : 30,
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={`absolute inset-0 flex flex-col text-left items-start justify-center ${!showFirst ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
              >
                {/* HEADLINE */}
                <h1 className="font-display font-extrabold text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tighter text-balance">
                  Kenya's #1 Bulk <br />
                  <span className="text-white">SMS & Messaging Platform</span>
                </h1>

                {/* SUBTITLE */}
                <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium max-w-xl mt-6 leading-relaxed text-balance">
                  Reach millions across Safaricom, Airtel & Telkom with AI-optimized campaigns, instant M-Pesa payments, and 99.99% delivery rates.
                </p>

                {/* CTA BUTTONS SCREEN 2 */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto font-sans">
                  <button
                    onClick={onOpenSignup}
                    className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none flex items-center justify-center gap-2 border border-transparent"
                  >
                    <span>Start Sending - It's Free</span>
                    <Rocket className="w-4 h-4" />
                  </button>

                  <a
                    href="#api-docs"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('api-docs')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto h-12 px-8 rounded-full text-sm font-semibold text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none backdrop-blur-sm shadow-sm"
                  >
                    <span>See How It Works</span>
                  </a>
                </div>
              </motion.div>

            </div>

            {/* Right Column: Spacer */}
            <div className="lg:col-span-5 h-[280px] sm:h-[350px] lg:h-full pointer-events-none" />
          </div>
        </div>

        {renderStats()}
      </div>
    </div>
  );
}
