import { CheckCircle2, Code2, Blocks, Webhook } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const integrationCards = [
  {
    icon: Code2,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'FULL PLATFORM ACCESS VIA REST API',
    description: 'Comprehensive set of RESTful endpoints',
    src: '/images/scrennn/Gemini_Generated_Image_grjfr7grjfr7grjf (Edited).png',
    bg: '#18252d',
    bullets: [
      'Comprehensive set of RESTful endpoints',
      'Manage contacts & audience segments',
      'Trigger multi-channel campaigns',
      'Access detailed analytics data',
    ],
  },
  {
    icon: Blocks,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'MODERN DEVELOPER TOOLS & SDKs',
    description: 'Officially supported SDKs',
    src: null,
    bg: '#141e2a',
    bullets: [
      'Officially supported SDKs',
      'Live interactive API documentation (OpenAPI/Swagger)',
      'Sandbox environments for testing',
      'Real-time API usage and performance metrics',
    ],
  },
  {
    icon: Webhook,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    title: 'WEBHOOKS & CUSTOM EVENT HANDLING',
    description: 'Configurable webhook endpoints',
    src: null,
    bg: '#131c28',
    bullets: [
      'Configurable webhook endpoints',
      'Event-driven integration',
      'Customize data payloads',
      'Secure authentication for outbound data',
    ],
  },
];

/* Inline SVG-style code block illustrations for the cards that don't have image assets */
function DevToolsVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[280px] relative perspective-[800px]">
        {/* Floating SDK badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {[
            { label: 'JS', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
            { label: 'PY', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
            { label: 'PHP', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
            { label: 'Go', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
          ].map((sdk) => (
            <div
              key={sdk.label}
              className={`px-3 py-1.5 rounded-lg ${sdk.bg} ${sdk.text} border ${sdk.border} text-xs font-mono font-bold`}
            >
              {sdk.label}
            </div>
          ))}
        </div>

        {/* Swagger-style doc preview */}
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="w-2 h-2 rounded-full bg-red-400/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
            <div className="w-2 h-2 rounded-full bg-green-400/60" />
            <span className="ml-2 text-[9px] font-mono text-gray-500">api-docs.trackom.dev</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-green-500/20 text-green-400 border border-green-500/20">GET</span>
              <span className="text-[10px] font-mono text-gray-400">/v1/campaigns</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/20">POST</span>
              <span className="text-[10px] font-mono text-gray-400">/v1/sms/send</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/20">PUT</span>
              <span className="text-[10px] font-mono text-gray-400">/v1/contacts/{'{id}'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/20">DEL</span>
              <span className="text-[10px] font-mono text-gray-400">/v1/webhooks/{'{id}'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhooksVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[280px]">
        {/* Webhook flow diagram */}
        <div className="space-y-3">
          {/* Event source */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">EVENT: sms.delivered</span>
          </div>

          {/* Arrow connector */}
          <div className="flex justify-center">
            <div className="w-px h-4 bg-gradient-to-b from-emerald-500/40 to-blue-500/40" />
          </div>

          {/* Webhook processor */}
          <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden backdrop-blur-sm">
            <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02]">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Webhook Payload</span>
            </div>
            <div className="p-3 font-mono text-[9px] leading-relaxed">
              <div className="text-gray-500">{'{'}</div>
              <div className="pl-3">
                <span className="text-blue-400">"event"</span>
                <span className="text-gray-500">: </span>
                <span className="text-emerald-400">"sms.delivered"</span>
                <span className="text-gray-500">,</span>
              </div>
              <div className="pl-3">
                <span className="text-blue-400">"recipient"</span>
                <span className="text-gray-500">: </span>
                <span className="text-amber-400">"+254712..."</span>
                <span className="text-gray-500">,</span>
              </div>
              <div className="pl-3">
                <span className="text-blue-400">"timestamp"</span>
                <span className="text-gray-500">: </span>
                <span className="text-purple-400">"2026-06-21T..."</span>
              </div>
              <div className="text-gray-500">{'}'}</div>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex justify-center">
            <div className="w-px h-4 bg-gradient-to-b from-blue-500/40 to-violet-500/40" />
          </div>

          {/* Target endpoint */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-[10px] font-mono text-violet-400 font-semibold">→ your-app.com/webhook</span>
            <span className="ml-auto text-[9px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">200 OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface APIIntegrationProps {
  onOpenSignup: () => void;
}

export default function APIIntegration({ onOpenSignup }: APIIntegrationProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="relative bg-white dark:bg-[#07070C] py-20 md:py-28 transition-colors duration-300 border-t border-slate-200/50 dark:border-white/5 overflow-hidden">
      {/* Background ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.02] blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* HEADER */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-4 text-center max-w-3xl mx-auto mb-14 md:mb-20 scroll-animate ${headerVisible ? 'is-visible' : ''}`}
        >
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-wide uppercase">
            Robust & Customizable API Integration
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Extend Trackom's power to your specific infrastructure.
          </p>
        </div>

        {/* 3-COLUMN GRID */}
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 scroll-animate ${gridVisible ? 'is-visible' : ''}`}
        >
          {integrationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex flex-col rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-md group transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: card.bg,
                  transitionDelay: `${index * 120}ms`,
                }}
              >
                {/* Visual Area */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/10 flex items-center justify-center">
                  {card.src ? (
                    <img
                      src={card.src}
                      alt={card.title}
                      className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : index === 1 ? (
                    <DevToolsVisual />
                  ) : (
                    <WebhooksVisual />
                  )}
                </div>

                {/* Text Content */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-display font-bold text-white text-sm lg:text-base leading-snug uppercase tracking-wide">
                      {card.title}
                    </h3>
                  </div>

                  {/* Checklist */}
                  <ul className="flex flex-col gap-2.5 mt-auto pt-3 border-t border-white/5">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div
          ref={ctaRef}
          className={`flex flex-col gap-6 text-center max-w-3xl mx-auto items-center scroll-animate ${ctaVisible ? 'is-visible' : ''}`}
        >
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide">
            Ready to Scale Your Business?
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none text-center"
            >
              Start Free Trial
            </button>
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none text-center"
            >
              Talk to a Strategist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
