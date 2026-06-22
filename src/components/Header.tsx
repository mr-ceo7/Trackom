import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Rocket, MessageSquare, BarChart3, Code2, HelpCircle, CreditCard } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import TrackomLogo from './TrackomLogo';

interface HeaderProps {
  onOpenSignup: () => void;
}

export default function Header({ onOpenSignup }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks = [
    { id: 'services', label: 'Services' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'api-docs', label: 'API' },
    { id: 'faq', label: 'FAQ' },
  ];

  const mobileNavLinks = [
    { id: 'services', label: 'Services', icon: <MessageSquare className="w-5 h-5 text-brand-primary" /> },
    { id: 'features', label: 'Features', icon: <BarChart3 className="w-5 h-5 text-brand-accent" /> },
    { id: 'pricing', label: 'Pricing', icon: <CreditCard className="w-5 h-5 text-brand-primary" /> },
    { id: 'api-docs', label: 'Developer API', icon: <Code2 className="w-5 h-5 text-brand-accent" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-5 h-5 text-brand-primary" /> },
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
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => scrollToSection(link.id, e)}
              className={`text-sm font-medium transition-colors duration-300 relative group ${
                scrolled
                  ? 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent group-hover:w-full transition-all duration-300 rounded-full" />
            </a>
          ))}
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
            <div className="p-5 flex flex-col gap-2">
              {mobileNavLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => scrollToSection(link.id, e)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  {link.icon}
                  <span className="font-medium text-base">{link.label}</span>
                </a>
              ))}

              <hr className="border-slate-200 dark:border-white/5 my-2" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSignup();
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg text-white font-semibold bg-brand-primary hover:bg-brand-primary-hover active:scale-98 transition-all duration-200 shadow-md cursor-pointer"
              >
                <span>Get Started</span>
                <Rocket className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
