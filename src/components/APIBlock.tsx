import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Terminal } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

type LanguageType = 'curl' | 'nodejs' | 'python' | 'php';

export default function APIBlock() {
  const [activeTab, setActiveTab] = useState<LanguageType>('curl');
  const [copied, setCopied] = useState(false);
  const { ref, isVisible } = useScrollAnimation();

  const codeSnippets: Record<LanguageType, { code: string; label: string }> = {
    curl: {
      code: `curl -X POST "https://api.trackomgroup.com/v1/sms/bulk" \\
  -H "Authorization: Bearer trk_live_xyz8846" \\
  -H "Content-Type: application/json" \\
  -d '{
    "campaign_name": "Flash_Sale_Promo",
    "recipients": ["+254712345678", "+254798765432"],
    "message": "Flash Sale! 50% off all plans. Code: GET50",
    "ai_optimize": true,
    "sender_id": "TRACKOM"
  }'`,
      label: 'cURL',
    },
    nodejs: {
      code: `import { TrackomClient } from '@trackom/sdk';

const trackom = new TrackomClient({ 
  apiKey: 'trk_live_xyz8846' 
});

const campaign = await trackom.sms.broadcast({
  campaignName: 'Flash_Sale_Promo',
  recipients: ['+254712345678', '+254798765432'],
  message: 'Flash Sale! 50% off all plans. Code: GET50',
  aiOptimize: true,
  senderId: 'TRACKOM'
});

console.log(\`Campaign \${campaign.id}: \${campaign.status}\`);`,
      label: 'Node.js',
    },
    python: {
      code: `from trackom import TrackomClient

client = TrackomClient(api_key="trk_live_xyz8846")

campaign = client.sms.broadcast(
    campaign_name="Flash_Sale_Promo",
    recipients=["+254712345678", "+254798765432"],
    message="Flash Sale! 50% off all plans. Code: GET50",
    ai_optimize=True,
    sender_id="TRACKOM"
)

print(f"Campaign {campaign['id']}: {campaign['status']}")`,
      label: 'Python',
    },
    php: {
      code: `<?php
use Trackom\\TrackomClient;

$client = new TrackomClient('trk_live_xyz8846');

$campaign = $client->sms->broadcast([
    'campaign_name' => 'Flash_Sale_Promo',
    'recipients' => ['+254712345678', '+254798765432'],
    'message' => 'Flash Sale! 50% off all plans. Code: GET50',
    'ai_optimize' => true,
    'sender_id' => 'TRACKOM'
]);

echo "Campaign {$campaign->id}: {$campaign->status}";`,
      label: 'PHP',
    },
  };

  const handleCopyCode = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(codeSnippets[activeTab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const tabs: LanguageType[] = ['curl', 'nodejs', 'python', 'php'];

  return (
    <section id="api-docs" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/6 scroll-mt-24">
      <div
        ref={ref}
        className={`grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-16 items-center scroll-animate ${isVisible ? 'is-visible' : ''}`}
      >
        {/* LEFT: DESCRIPTION */}
        <div className="flex flex-col gap-8 text-left">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest text-brand-accent font-mono font-semibold">
              Developer-First API
            </div>
            <h2 className="font-display font-bold text-white text-3xl sm:text-4xl md:text-5xl leading-tight">
              Integrate in minutes.{' '}
              <br />
              <span className="gradient-text">Scale to millions.</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-lg">
              Clean REST API, official SDKs for Node.js, Python, and PHP, plus real-time webhooks. Built for Kenyan developers.
            </p>
          </div>

          <ul className="space-y-4 font-medium text-gray-200">
            {[
              { text: 'RESTful API with comprehensive docs', color: 'brand-accent' },
              { text: 'Official SDKs: Node.js, Python, PHP', color: 'brand-primary' },
              { text: 'Real-time Webhooks & Callbacks', color: 'brand-emerald' },
              { text: 'Sandbox testing environment', color: 'brand-primary' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-6 h-6 rounded-lg bg-${item.color}/10 text-${item.color}`}>
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-brand-primary-light border border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all group active:scale-95 duration-300"
            >
              <span>Explore API Documentation</span>
              <Terminal className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* RIGHT: CODE BLOCK */}
        <div className="shadow-2xl rounded-2xl border border-white/6 overflow-hidden bg-surface-card relative">
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 md:px-6 h-12 border-b border-white/6 bg-white/[0.02]">
            <div className="flex gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-300 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {tab === 'nodejs' ? 'Node.js' : tab === 'curl' ? 'cURL' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-mono font-medium text-gray-500 tracking-wider hidden sm:block uppercase">
              {codeSnippets[activeTab].label}
            </div>
          </div>

          {/* Code */}
          <div className="p-6 md:p-8 bg-surface-dark text-left font-mono text-xs sm:text-[13px] leading-relaxed relative overflow-hidden">
            <button
              onClick={handleCopyCode}
              className="absolute top-4 right-4 p-2.5 rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-all duration-300 active:scale-95 group"
              aria-label="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    className="absolute -top-10 right-0 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-sans font-bold whitespace-nowrap shadow-md"
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <pre className="text-gray-300 whitespace-pre overflow-x-auto select-all max-h-80 md:max-h-none py-1.5">
              <code>{codeSnippets[activeTab].code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
