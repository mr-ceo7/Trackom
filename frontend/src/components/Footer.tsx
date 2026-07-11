import { Link, useLocation, useNavigate } from 'react-router-dom';
import TrackomLogo from './TrackomLogo';

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <footer id="contact" className="bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/6 py-5 md:py-8 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 md:gap-8 text-left">
          {/* Brand */}
          <div className="flex flex-col gap-2.5 col-span-2 md:col-span-2">
            <TrackomLogo size={22} />
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed max-w-sm md:max-w-md">
              Kenya's leading enterprise bulk SMS platform. Send promotional, transactional, and campaign-based SMS messages at scale.
            </p>
            <div className="flex items-center gap-2.5">
              {/* Social icons */}
              {['X', 'in', 'GH'].map((icon) => (
                <a key={icon} href="#" className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/6 flex items-center justify-center text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-[11px] font-bold">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="col-span-1">
            <h5 className="font-display font-semibold text-xs uppercase text-slate-700 dark:text-gray-300 tracking-wider mb-1.5 md:mb-3">Products</h5>
            <ul className="space-y-1 md:space-y-2 text-xs text-slate-500 dark:text-gray-400 font-medium">
              {['Bulk SMS', 'Reseller Platform'].map((item) => (
                <li key={item}>
                  <a 
                    href="#services" 
                    onClick={(e) => scrollToSection('services', e)}
                    className="hover:text-brand-primary-light transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div className="col-span-1">
            <h5 className="font-display font-semibold text-xs uppercase text-slate-700 dark:text-gray-300 tracking-wider mb-1.5 md:mb-3">Developers</h5>
            <ul className="space-y-1 md:space-y-2 text-xs text-slate-500 dark:text-gray-400 font-medium">
              {['API Reference', 'SDKs & Tools', 'Webhooks'].map((item) => (
                <li key={item}>
                  <Link 
                    to="/docs" 
                    className="hover:text-brand-primary-light transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider">
          <span>© 2026 Trackom Group. All rights reserved.</span>
          <span>trackomgroup.com</span>
        </div>
      </div>
    </footer>
  );
}
