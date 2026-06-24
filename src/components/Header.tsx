import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Rocket, 
  MessageSquare, 
  HelpCircle, 
  CreditCard,
  ChevronDown,
  ShieldCheck,
  Repeat,
  Briefcase,
  Terminal,
  Cpu,
  Wallet
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import TrackomLogo from './TrackomLogo';

interface HeaderProps {
  onOpenSignup: () => void;
}

export default function Header({ onOpenSignup }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'solutions' | 'developers' | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    setActiveDropdown(null);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const solutionsItems = [
    { 
      title: 'SMS Marketing', 
      description: 'Promotional campaigns with smart carrier routing.',
      id: 'features', 
      icon: <MessageSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 
    },
    { 
      title: 'OTP & Verification', 
      description: 'Secure, instant transactional alerts (<180ms).',
      id: 'services', 
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> 
    },
    { 
      title: 'Two-Way SMS', 
      description: 'Interactive responses with custom shortcodes.',
      id: 'services', 
      icon: <Repeat className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> 
    },
    { 
      title: 'Reseller Portal', 
      description: 'Start your own white-label bulk SMS business.',
      id: 'resellers', 
      icon: <Briefcase className="w-5 h-5 text-purple-500 dark:text-purple-400" /> 
    },
  ];

  const developerItems = [
    { 
      title: 'API Reference', 
      description: 'RESTful endpoints, SMPP, and secure HTTP webhooks.',
      id: 'api-docs', 
      icon: <Terminal className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 
    },
    { 
      title: 'SDKs & Tools', 
      description: 'Vibrant developer kits for React, Node, Python, & PHP.',
      id: 'api-docs', 
      icon: <Cpu className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> 
    },
    { 
      title: 'M-Pesa API Sync', 
      description: 'Trigger SMS automatically on M-Pesa receipts.',
      id: 'api-docs', 
      icon: <Wallet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> 
    },
  ];

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8 ${
        scrolled
          ? 'py-3 glass shadow-lg shadow-black/10'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* LOGO */}
        <a
          href="#"
          onClick={(e) => scrollToSection('top-page', e)}
          className="group focus:outline-none relative z-10"
        >
          <TrackomLogo
            size={28}
            glowing={scrolled}
            textColorClass={scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}
          />
        </a>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Desktop Navigation">
          {/* Solutions Dropdown */}
          <div 
            className="relative py-2"
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-300 focus:outline-none cursor-pointer ${
                scrolled
                  ? 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>Solutions</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeDropdown === 'solutions' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-80 rounded-xl glass p-4 shadow-xl border border-slate-200 dark:border-white/10 z-50"
                >
                  <div className="flex flex-col gap-2">
                    {solutionsItems.map((item) => (
                      <a
                        key={item.title}
                        href={`#${item.id}`}
                        onClick={(e) => scrollToSection(item.id, e)}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 group text-left"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 group-hover:bg-brand-primary/10 transition-colors shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pricing Link */}
          <a
            href="#pricing"
            onClick={(e) => scrollToSection('pricing', e)}
            className={`text-sm font-medium transition-colors duration-300 relative group ${
              scrolled
                ? 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent group-hover:w-full transition-all duration-300 rounded-full" />
          </a>

          {/* Developers Dropdown */}
          <div 
            className="relative py-2"
            onMouseEnter={() => setActiveDropdown('developers')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-300 focus:outline-none cursor-pointer ${
                scrolled
                  ? 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>Developers</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'developers' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeDropdown === 'developers' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-80 rounded-xl glass p-4 shadow-xl border border-slate-200 dark:border-white/10 z-50"
                >
                  <div className="flex flex-col gap-2">
                    {developerItems.map((item) => (
                      <a
                        key={item.title}
                        href={`#${item.id}`}
                        onClick={(e) => scrollToSection(item.id, e)}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 group text-left"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 group-hover:bg-brand-primary/10 transition-colors shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Link */}
          <a
            href="#faq"
            onClick={(e) => scrollToSection('faq', e)}
            className={`text-sm font-medium transition-colors duration-300 relative group ${
              scrolled
                ? 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            FAQ
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent group-hover:w-full transition-all duration-300 rounded-full" />
          </a>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">
          <ThemeToggle
            className={
              scrolled
                ? 'border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-white'
                : 'border border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
            }
          />

          <button
            onClick={onOpenSignup}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none"
          >
            <span>Get Started</span>
            <Rocket className="w-4 h-4" />
          </button>

          {/* HAMBURGER */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden flex items-center justify-center p-2 rounded-lg transition-all duration-200 cursor-pointer border ${
              scrolled
                ? 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200 dark:border-white/10'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-white/10'
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden mt-3 max-w-7xl mx-auto rounded-xl glass"
          >
            <div className="p-5 flex flex-col gap-4">
              {/* Solutions List */}
              <div className="flex flex-col gap-1">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">
                  Solutions
                </div>
                {solutionsItems.map((item) => (
                  <a
                    key={item.title}
                    href={`#${item.id}`}
                    onClick={(e) => scrollToSection(item.id, e)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.title}</span>
                  </a>
                ))}
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              {/* Developers List */}
              <div className="flex flex-col gap-1">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">
                  Developers
                </div>
                {developerItems.map((item) => (
                  <a
                    key={item.title}
                    href={`#${item.id}`}
                    onClick={(e) => scrollToSection(item.id, e)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.title}</span>
                  </a>
                ))}
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              {/* General Links */}
              <div className="flex flex-col gap-1">
                <a
                  href="#pricing"
                  onClick={(e) => scrollToSection('pricing', e)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  <CreditCard className="w-5 h-5 text-brand-primary" />
                  <span className="font-medium text-sm">Pricing</span>
                </a>

                <a
                  href="#faq"
                  onClick={(e) => scrollToSection('faq', e)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  <HelpCircle className="w-5 h-5 text-brand-accent" />
                  <span className="font-medium text-sm">FAQ</span>
                </a>
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSignup();
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-white font-semibold bg-brand-primary hover:bg-brand-primary-hover active:scale-98 transition-all duration-200 shadow-md cursor-pointer"
              >
                <span>Get Started</span>
                <Rocket className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
