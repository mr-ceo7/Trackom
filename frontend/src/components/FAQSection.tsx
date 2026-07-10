import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkles, MessageSquare, ShieldCheck, Cpu, CreditCard, Users, Search } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { filterFAQByQuery } from '../utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We primarily accept M-Pesa (Lipa Na M-Pesa) for instant top-ups. You can also pay via credit/debit cards and bank transfers. All payments are processed securely and SMS credits are loaded to your account instantly after payment confirmation.',
    icon: <span className="p-1 rounded-lg bg-brand-accent/10 text-brand-accent"><CreditCard className="w-4 h-4" /></span>,
  },
  {
    category: 'Reseller',
    question: 'How do I become a Trackom reseller?',
    answer: 'Apply for a reseller account through our platform. Once approved, you get access to wholesale SMS rates, a white-label portal with your own branding, and the ability to set your own pricing for your clients. Minimum purchase requirements apply. Contact our sales team for custom wholesale rate negotiations.',
    icon: <span className="p-1 rounded-lg bg-brand-primary/10 text-brand-primary"><Users className="w-4 h-4" /></span>,
  },
  {
    category: 'Coverage',
    question: 'What carriers does Trackom support in Kenya?',
    answer: 'Trackom has direct carrier integrations with Safaricom, Airtel Kenya, and Telkom Kenya. Our Smart Route Shuffler automatically selects the optimal delivery path. We also support international SMS to 200+ countries for cross-border campaigns.',
    icon: <span className="p-1 rounded-lg bg-brand-accent/10 text-brand-accent"><MessageSquare className="w-4 h-4" /></span>,
  },

  {
    category: 'API',
    question: 'What are the API rate limits?',
    answer: 'Our REST API supports up to 10,000 requests per second on standard plans. Growth plan users get concurrent routing across multiple carrier pathways. Enterprise users can request custom rate limits and dedicated carrier gateways supporting 50,000+ parallel streams per second. Full API documentation is available at docs.trackomgroup.com.',
    icon: <span className="p-1 rounded-lg bg-brand-accent/10 text-brand-accent"><Sparkles className="w-4 h-4" /></span>,
  },
  {
    category: 'Compliance',
    question: 'How does Trackom ensure delivery compliance?',
    answer: 'All messages are verified against Communications Authority of Kenya (CA) regulations. We maintain opt-out management, DND (Do Not Disturb) list compliance, and automated content screening. Our Route Shuffler dynamically reroutes campaigns if any carrier path experiences degradation, ensuring 99.99% uptime SLA.',
    icon: <span className="p-1 rounded-lg bg-brand-primary/10 text-brand-primary"><ShieldCheck className="w-4 h-4" /></span>,
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { ref, isVisible } = useScrollAnimation();

  const filteredFaqs = filterFAQByQuery(faqs, searchQuery);

  return (
    <section id="faq" className="py-6 md:py-14 px-4 md:px-8 max-w-4xl mx-auto scroll-mt-24">
      {/* HEADER */}
      <div
        ref={ref}
        className={`flex flex-col gap-4 text-center max-w-2xl mx-auto mb-12 scroll-animate ${isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-xs uppercase tracking-widest text-brand-primary font-mono font-semibold">
          Frequently Asked Questions
        </div>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-3xl md:text-5xl leading-tight">
          Questions?{' '}
          <span className="gradient-text">We've got you covered.</span>
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base">
          Everything Kenyan businesses ask about Trackom - from M-Pesa payments to carrier coverage and API limits.
        </p>

        {/* SEARCH BAR */}
        <div className="relative max-w-md mx-auto w-full mt-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenIndex(null); // Close active when filtering
            }}
            placeholder="Search FAQs (e.g. M-Pesa, reseller)..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
          />
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-gray-500" />
        </div>
      </div>

      {/* ACCORDION */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`clay-card rounded-2xl transition-all duration-300 overflow-hidden ${
                    isOpen ? 'ring-1 ring-brand-primary/20' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4 pr-4">
                      <span className="shrink-0">{faq.icon}</span>
                      <div className="space-y-0.5">
                        <span className="block text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">
                          {faq.category}
                        </span>
                        <span className="block font-display font-semibold text-sm md:text-base text-slate-900 dark:text-white leading-normal">
                          {faq.question}
                        </span>
                      </div>
                    </div>

                    <div className={`size-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 bg-brand-primary/10 text-brand-primary-light' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`faq-content-${faq.question}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.3, ease: 'easeInOut' }, opacity: { duration: 0.2 } }}
                      >
                        <div className="px-5 pb-6 pt-1 md:px-6 border-t border-slate-200 dark:border-white/5">
                          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed max-w-3xl">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 border border-dashed border-slate-300 dark:border-white/10 rounded-xl"
            >
              <p className="text-slate-500 dark:text-gray-500 text-sm">No matching FAQs found for "{searchQuery}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
