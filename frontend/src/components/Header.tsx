import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'solutions' | 'developers' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (!isHome) {
      setActiveSection('');
      return;
    }

    const sections = ['features', 'services', 'resellers', 'how-it-works', 'api-docs', 'faq'];
    
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(id);
        }
      }, { threshold: 0.22, rootMargin: '-10% 0px -40% 0px' });

      observer.observe(el);
      return { observer, el };
    }).filter(Boolean);

    return () => {
      observers.forEach(item => {
        if (item) {
          item.observer.unobserve(item.el);
        }
      });
    };
  }, [isHome]);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    setActiveDropdown(null);
    if (isHome) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(`/#${id}`);
    }
  };

  const solutionsItems = [
    { 
      title: 'SMS Marketing', 
      description: 'Promotional campaigns with smart carrier routing.',
      path: '/solutions/sms-marketing', 
      icon: <MessageSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 
    },
    { 
      title: 'OTP & Verification', 
      description: 'Secure, instant transactional alerts (<180ms).',
      path: '/solutions/otp-verification', 
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> 
    },
    { 
      title: 'Two-Way SMS', 
      description: 'Interactive responses with custom shortcodes.',
      path: '/solutions/two-way-sms', 
      icon: <Repeat className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> 
    },
    { 
      title: 'Reseller Portal', 
      description: 'Start your own white-label bulk SMS business.',
      path: '/solutions/reseller-portal', 
      icon: <Briefcase className="w-5 h-5 text-purple-500 dark:text-purple-400" /> 
    },
  ];

  const developerItems = [
    { 
      title: 'API Reference', 
      description: 'RESTful endpoints, SMPP, and secure HTTP webhooks.',
      path: '/docs', 
      icon: <Terminal className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 
    },
    { 
      title: 'SDKs & Tools', 
      description: 'Vibrant developer kits for React, Node, Python, & PHP.',
      path: '/docs', 
      icon: <Cpu className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> 
    },
    { 
      title: 'M-Pesa API Sync', 
      description: 'Trigger SMS automatically on M-Pesa receipts.',
      path: '/docs', 
      icon: <Wallet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> 
    },
  ];

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-primary focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
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
        <Link
          to="/"
          onClick={(e) => {
            if (isHome) {
              scrollToSection('top-page', e);
            }
          }}
          className="group focus:outline-none relative z-10"
        >
          <TrackomLogo
            size={28}
            glowing={scrolled}
            textColorClass="text-slate-900 dark:text-white"
          />
        </Link>

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
                ['features', 'services', 'resellers'].includes(activeSection) || location.pathname.startsWith('/solutions')
                  ? 'text-brand-primary dark:text-white font-bold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
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
                      <Link
                        key={item.title}
                        to={item.path}
                        onClick={() => {
                          setIsOpen(false);
                          setActiveDropdown(null);
                        }}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-200 group text-left ${
                          location.pathname === item.path 
                            ? 'bg-brand-primary/10 dark:bg-white/10' 
                            : 'hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                          location.pathname === item.path 
                            ? 'bg-brand-primary/20 text-brand-primary' 
                            : 'bg-slate-100 dark:bg-white/5 group-hover:bg-brand-primary/10'
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <div className={`font-semibold text-sm transition-colors ${
                            location.pathname === item.path 
                              ? 'text-brand-primary font-bold' 
                              : 'text-slate-900 dark:text-white group-hover:text-brand-primary'
                          }`}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* About Us Link */}
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection('how-it-works', e)}
            className={`text-sm font-medium transition-colors duration-300 relative group ${
              activeSection === 'how-it-works'
                ? 'text-brand-primary dark:text-white font-bold'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            About Us
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-300 ${
              activeSection === 'how-it-works' ? 'w-full' : 'w-0 group-hover:w-full'
            }`} />
          </a>

          {/* Developers Dropdown */}
          <div 
            className="relative py-2"
            onMouseEnter={() => setActiveDropdown('developers')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-300 focus:outline-none cursor-pointer ${
                activeSection === 'api-docs' || location.pathname === '/docs'
                  ? 'text-brand-primary dark:text-white font-bold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
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
                      <Link
                        key={item.title}
                        to={item.path}
                        onClick={() => {
                          setIsOpen(false);
                          setActiveDropdown(null);
                        }}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-200 group text-left ${
                          location.pathname === item.path
                            ? 'bg-brand-primary/10 dark:bg-white/10'
                            : 'hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                          location.pathname === item.path
                            ? 'bg-brand-primary/20 text-brand-primary'
                            : 'bg-slate-100 dark:bg-white/5 group-hover:bg-brand-primary/10'
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <div className={`font-semibold text-sm transition-colors ${
                            location.pathname === item.path
                              ? 'text-brand-primary font-bold'
                              : 'text-slate-900 dark:text-white group-hover:text-brand-primary'
                          }`}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Blog Link */}
          <Link
            to="/blog"
            className={`text-sm font-medium transition-colors duration-300 relative group ${
              location.pathname === '/blog'
                ? 'text-brand-primary dark:text-white font-bold'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Blog
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-300 ${
              location.pathname === '/blog' ? 'w-full' : 'w-0 group-hover:w-full'
            }`} />
          </Link>

          {/* FAQ Link */}
          <a
            href="#faq"
            onClick={(e) => scrollToSection('faq', e)}
            className={`text-sm font-medium transition-colors duration-300 relative group ${
              activeSection === 'faq'
                ? 'text-brand-primary dark:text-white font-bold'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            FAQ
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-300 ${
              activeSection === 'faq' ? 'w-full' : 'w-0 group-hover:w-full'
            }`} />
          </a>

          {/* Contact Link */}
          <Link
            to="/contact"
            className="text-sm font-medium transition-colors duration-300 relative group text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
          >
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent group-hover:w-full transition-all duration-300 rounded-full" />
          </Link>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">
          <ThemeToggle
            className="border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
          />

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none"
          >
            <span>Sign In</span>
            <Rocket className="w-4 h-4" />
          </Link>

          {/* HAMBURGER */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg transition-all duration-200 cursor-pointer border text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200 dark:border-white/10"
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
                  <Link
                    key={item.title}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.title}</span>
                  </Link>
                ))}
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              {/* Developers List */}
              <div className="flex flex-col gap-1">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">
                  Developers
                </div>
                {developerItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.title}</span>
                  </Link>
                ))}
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              {/* General Links */}
              <div className="flex flex-col gap-1">
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection('how-it-works', e)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  <Cpu className="w-5 h-5 text-brand-primary" />
                  <span className="font-medium text-sm">About Us</span>
                </a>

                <Link
                  to="/blog"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  <MessageSquare className="w-5 h-5 text-brand-accent" />
                  <span className="font-medium text-sm">Blog</span>
                </Link>

                <a
                  href="#faq"
                  onClick={(e) => scrollToSection('faq', e)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  <HelpCircle className="w-5 h-5 text-brand-emerald" />
                  <span className="font-medium text-sm">FAQ</span>
                </a>

                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  <ShieldCheck className="w-5 h-5 text-brand-primary" />
                  <span className="font-medium text-sm">Contact</span>
                </Link>
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-white font-semibold bg-brand-primary hover:bg-brand-primary-hover active:scale-98 transition-all duration-200 shadow-md cursor-pointer text-sm"
              >
                <span>Sign In</span>
                <Rocket className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}
