import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Wifi } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  sector: string;
}

const partners: Partner[] = [
  { id: 'equity', name: 'Equity Bank', sector: 'Banking' },
  { id: 'safaricom', name: 'Safaricom', sector: 'Telecom' },
  { id: 'jumia', name: 'Jumia Kenya', sector: 'E-Commerce' },
  { id: 'nairobi-hospital', name: 'Nairobi Hospital', sector: 'Healthcare' },
  { id: 'kplc', name: 'Kenya Power', sector: 'Government' },
  { id: 'mkulima', name: 'Mkulima SACCO', sector: 'SACCO' },
  { id: 'strathmore', name: 'Strathmore Uni', sector: 'Education' },
  { id: 'paylink', name: 'PayLink Solutions', sector: 'Fintech' },
];

export default function PartnerLogos() {
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [clickedPartner, setClickedPartner] = useState<string | null>(null);

  const handleClick = (partner: Partner) => {
    setClickedPartner(partner.name);
    setTimeout(() => setClickedPartner(null), 3000);
  };

  const renderPartnerButton = (partner: Partner, keyPrefix: string) => (
    <button
      key={`${keyPrefix}-${partner.id}`}
      onClick={() => handleClick(partner)}
      onMouseEnter={() => setActivePartner(partner)}
      onMouseLeave={() => setActivePartner(null)}
      className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-brand-primary/20 text-gray-500 hover:text-brand-primary-light pointer-events-auto transition-all duration-300 transform hover:scale-[1.03] active:scale-95 cursor-pointer relative group"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-brand-primary-light group-hover:bg-brand-primary/10 transition-all duration-300">
        {partner.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
      </div>
      <span className="font-medium text-sm text-gray-400 group-hover:text-gray-200 transition-colors duration-300 whitespace-nowrap">
        {partner.name}
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );

  return (
    <section id="partners" className="relative w-full border-b border-white/6 bg-surface-card/30 py-8 overflow-hidden z-20">
      {/* Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest">
            Trusted by Kenya's leading enterprises
          </span>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="relative w-full overflow-hidden animate-marquee-hover-pause py-3">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface-dark to-transparent z-10 pointer-events-none" />

        <div className="flex w-full">
          <div className="animate-marquee flex gap-6 items-center whitespace-nowrap">
            {partners.map(p => renderPartnerButton(p, 'a'))}
            {partners.map(p => renderPartnerButton(p, 'b'))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-3 min-h-8 flex items-center justify-between">
        <div className="text-xs font-mono text-gray-500 font-medium">
          <AnimatePresence mode="wait">
            {activePartner ? (
              <motion.div
                key={activePartner.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 text-brand-primary-light"
              >
                <span>{activePartner.name}</span>
                <span className="w-px h-3 bg-white/10" />
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  Sector: {activePartner.sector}
                </span>
              </motion.div>
            ) : (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="text-[11px]">
                Hover a client to see details
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="text-xs font-mono font-semibold text-brand-emerald">
          <AnimatePresence>
            {clickedPartner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-1.5 bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-lg"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Connected: {clickedPartner}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
