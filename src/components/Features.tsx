import { useEffect, useRef, useState } from 'react';
import { Cpu, Shuffle, BarChart2, Users, Star } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function Features() {
  // AI Typewriter
  const [aiText, setAiText] = useState('');
  const [aiTypingIndex, setAiTypingIndex] = useState(0);
  const [copyVariant, setCopyVariant] = useState(0);

  const copywritingDemos = [
    { text: 'FLASH SALE: Get 20% off this weekend! Use code FRIDAY20 at checkout. Shop now: trk.om/sale', rating: '9.4% CTR (+32%)' },
    { text: 'Hi {{name}}, your M-Pesa payment of KES 2,500 is confirmed. Ref: TRK849291. Thank you!', rating: '99.8% delivery' },
    { text: 'Reminder: Your appointment at Nairobi Hospital is tomorrow at 10AM. Reply YES to confirm.', rating: '78% response rate' },
  ];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentDemo = copywritingDemos[copyVariant];

    if (aiTypingIndex < currentDemo.text.length) {
      timer = setTimeout(() => {
        setAiText((prev) => prev + currentDemo.text.charAt(aiTypingIndex));
        setAiTypingIndex((prev) => prev + 1);
      }, 30);
    } else {
      timer = setTimeout(() => {
        setAiText('');
        setAiTypingIndex(0);
        setCopyVariant((prev) => (prev + 1) % copywritingDemos.length);
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [aiTypingIndex, copyVariant]);

  // Canvas particle visualizer
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 300);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 500;
      height = canvas.height = 300;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number; y: number; speed: number; radius: number; color: string; targetY: number;
    }
    const particles: Particle[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const leftNodeX = 60;
      const leftNodeY = height / 2;
      const rightNodeX = width - 60;
      const targets = [height / 4, height / 2, (height * 3) / 4];

      // Draw pathways
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
      ctx.lineWidth = 1.5;
      targets.forEach((tY) => {
        ctx.beginPath();
        ctx.moveTo(leftNodeX, leftNodeY);
        ctx.bezierCurveTo(width / 3, leftNodeY, (width * 2) / 3, tY, rightNodeX, tY);
        ctx.stroke();
      });

      // Spawn
      if (Math.random() < 0.08) {
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        particles.push({
          x: leftNodeX, y: leftNodeY,
          speed: Math.random() * 2 + 2,
          radius: Math.random() * 2.5 + 1.5,
          color: randomTarget === targets[1] ? '#06B6D4' : '#6366F1',
          targetY: randomTarget,
        });
      }

      // Update & draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speed;
        const progressX = (p.x - leftNodeX) / (rightNodeX - leftNodeX);
        p.y = leftNodeY + (p.targetY - leftNodeY) * (progressX * progressX * (3 - 2 * progressX));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.x >= rightNodeX) particles.splice(i, 1);
      }

      // Nodes
      ctx.save();
      ctx.translate(leftNodeX, leftNodeY);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#6366F1';
      ctx.fill();
      ctx.restore();

      targets.forEach((tY) => {
        ctx.save();
        ctx.translate(rightNodeX, tY);
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#06B6D4';
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section id="features" className="py-10 md:py-14 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* HEADER */}
      <div
        ref={headerRef}
        className={`flex flex-col gap-4 text-left max-w-3xl mb-16 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
      >
        <div className="text-xs uppercase tracking-widest text-brand-primary font-mono font-semibold">
          Powerful Features
        </div>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl md:text-5xl leading-tight">
          Tools that give you{' '}
          <span className="gradient-text">the edge.</span>
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg">
          AI-powered SMS copywriting, smart carrier routing across Safaricom, Airtel & Telkom, real-time campaign analytics, and seamless M-Pesa payment tracking.
        </p>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* CARD 1: SMART ROUTE SHUFFLER */}
        <div className="glass-card group rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10 max-w-md">
            <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary w-fit mb-6 transition-transform group-hover:scale-110">
              <Shuffle className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-2xl mb-3">Smart Route Shuffler</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
              Automatically splits SMS across multiple carrier routes for maximum deliverability. Sub-second failover when any route degrades.
            </p>
          </div>

          <div className="mt-8 border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-surface-dark/60 rounded-xl overflow-hidden relative h-64 flex items-center justify-center">
            <span className="absolute top-3 left-4 flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 font-mono tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
              </span>
              CARRIER ROUTE TELEMETRY
            </span>
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* RIGHT STACK */}
        <div className="flex flex-col gap-6">
          {/* CARD 2: AI COPYWRITER */}
          <div className="glass-card group rounded-2xl p-8 flex flex-col justify-between relative">
            <div>
              <div className="p-3 rounded-xl bg-brand-accent/10 text-brand-accent w-fit mb-6 transition-transform group-hover:scale-110">
                <Cpu className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white text-xl mb-2">AI SMS Copywriter</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                Generate high-converting SMS copy tailored to your brand. Avoid spam filters, boost CTR by up to 34%.
              </p>
            </div>

            {/* Terminal */}
            <div className="bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-white/6 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2.5 mb-4">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-emerald/10 text-brand-emerald text-[10px] font-semibold font-mono">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{copywritingDemos[copyVariant].rating}</span>
                </div>
              </div>

              <div className="font-mono text-xs md:text-sm text-slate-700 dark:text-gray-300 min-h-14 flex items-start leading-relaxed">
                <span className="text-brand-accent mr-2 shrink-0 select-none">&gt;</span>
                <div>
                  <span>{aiText}</span>
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-brand-accent cursor-blink" />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: ANALYTICS */}
          <div className="glass-card group rounded-2xl p-8 flex flex-col relative">
            <div className="p-3 rounded-xl bg-brand-emerald/10 text-brand-emerald w-fit mb-6 transition-transform group-hover:scale-110">
              <BarChart2 className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-xl mb-2">Campaign Analytics</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
              Real-time delivery tracking, open rate insights, and conversion analytics. Know exactly how your campaigns perform.
            </p>

            {/* Mini chart */}
            <div className="flex items-end justify-between w-full h-16 gap-1">
              {Array.from({ length: 20 }).map((_, i) => {
                const h = 20 + Math.sin(i * 0.7) * 30 + Math.random() * 20;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all duration-300 ${
                      i % 3 === 0 ? 'bg-brand-accent/60' : i % 2 === 0 ? 'bg-brand-primary/60' : 'bg-brand-primary/30'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
