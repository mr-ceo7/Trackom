import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Wifi } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  sector: string;
  color: string; // Brand color for hover glows
  logo: ReactNode;
}

const partners: Partner[] = [
  {
    id: 'safaricom',
    name: 'Safaricom',
    sector: 'Telecom',
    color: 'group-hover:border-emerald-500/40 group-hover:text-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#10B981" fillOpacity="0.15" />
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#10B981" />
        <path d="M12 4C7.58 4 4 7.58 4 12C4 13.5 4.5 15 5.2 16.2L16.2 5.2C15 4.5 13.5 4 12 4Z" fill="#EF4444" />
      </svg>
    ),
  },
  {
    id: 'equity',
    name: 'Equity Bank',
    sector: 'Banking',
    color: 'group-hover:border-amber-700/40 group-hover:text-amber-500 group-hover:shadow-[0_0_12px_rgba(180,83,9,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="11" width="18" height="9" rx="1" fill="#B45309" />
        <polygon points="12,3 2,11 22,11" fill="#B45309" />
        <rect x="10" y="14" width="4" height="6" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'jumia',
    name: 'Jumia Kenya',
    sector: 'E-Commerce',
    color: 'group-hover:border-orange-500/40 group-hover:text-orange-400 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    id: 'nairobi-hospital',
    name: 'Nairobi Hospital',
    sector: 'Healthcare',
    color: 'group-hover:border-teal-500/40 group-hover:text-teal-400 group-hover:shadow-[0_0_12px_rgba(20,184,166,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#14B8A6" fillOpacity="0.1" />
        <path d="M12 6V18M6 12H18" stroke="#14B8A6" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'kplc',
    name: 'Kenya Power',
    sector: 'Government',
    color: 'group-hover:border-yellow-500/40 group-hover:text-yellow-400 group-hover:shadow-[0_0_12px_rgba(234,179,8,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L10 22L21 10H12L13 2Z" fill="#EAB308" />
      </svg>
    ),
  },
  {
    id: 'mkulima',
    name: 'Mkulima SACCO',
    sector: 'SACCO',
    color: 'group-hover:border-green-600/40 group-hover:text-green-400 group-hover:shadow-[0_0_12px_rgba(22,163,74,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 11 17 11s-5 2-6 9z" fill="#22C55E" fillOpacity="0.15" />
        <path d="M9 22V11" />
      </svg>
    ),
  },
  {
    id: 'strathmore',
    name: 'Strathmore Uni',
    sector: 'Education',
    color: 'group-hover:border-blue-600/40 group-hover:text-blue-400 group-hover:shadow-[0_0_12px_rgba(30,58,138,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L3 6.5V13.5C3 18.25 12 22 12 22C12 22 21 18.25 21 13.5V6.5L12 2Z" fill="#1E3A8A" />
        <polygon points="12,6 8.5,9.5 12,13 15.5,9.5" fill="#EAB308" />
      </svg>
    ),
  },
  {
    id: 'paylink',
    name: 'PayLink Solutions',
    sector: 'Fintech',
    color: 'group-hover:border-indigo-500/40 group-hover:text-indigo-400 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
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
      className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] text-slate-600 dark:text-gray-400 pointer-events-auto transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer relative group ${partner.color}`}
    >
      <div className="flex items-center justify-center">
        {partner.logo}
      </div>
      <span className="font-semibold text-sm text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300 whitespace-nowrap">
        {partner.name}
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );

  return (
    <section id="partners" className="relative w-full border-y border-slate-200/60 dark:border-white/5 bg-slate-100/50 dark:bg-[#07070C] py-10 overflow-hidden z-20 transition-colors duration-300">
      {/* Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
            Trusted by Kenya's leading enterprises
          </span>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="relative w-full overflow-hidden py-3">
        {/* Soft edge masking */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50/80 dark:from-[#07070C] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50/80 dark:from-[#07070C] to-transparent z-10 pointer-events-none" />

        <div className="flex w-full">
          <div className="animate-marquee flex gap-6 items-center whitespace-nowrap">
            {partners.map(p => renderPartnerButton(p, 'a'))}
            {partners.map(p => renderPartnerButton(p, 'b'))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5 min-h-8 flex items-center justify-between">
        <div className="text-xs font-mono text-slate-500 dark:text-gray-400 font-medium">
          <AnimatePresence mode="wait">
            {activePartner ? (
              <motion.div
                key={activePartner.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold"
              >
                <span>{activePartner.name}</span>
                <span className="w-px h-3 bg-slate-300 dark:bg-white/10" />
                <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-gray-400">
                  <Wifi className="w-3.5 h-3.5" />
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
