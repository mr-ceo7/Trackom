/**
 * BottomNav - mobile-only bottom navigation bar for the dashboard.
 * Visible only below the lg breakpoint. Provides quick access to core sections
 * plus a "More" button that opens the full sidebar overlay.
 */
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Send, Users, Megaphone, Menu } from 'lucide-react';

interface BottomNavProps {
  onOpenSidebar: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/dashboard/compose', icon: Send, label: 'Compose' },
  { to: '/dashboard/contacts', icon: Users, label: 'Contacts' },
  { to: '/dashboard/campaigns', icon: Megaphone, label: 'Campaigns' },
];

export default function BottomNav({ onOpenSidebar }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Frosted glass background with upward shadow */}
      <div className="bg-white/80 dark:bg-surface-card/80 backdrop-blur-xl border-t border-slate-200/40 dark:border-white/[0.06] rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl min-w-[3.5rem] transition-all duration-200 ${
                  isActive
                    ? 'text-brand-primary dark:text-brand-primary-light'
                    : 'text-slate-500 dark:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator dot */}
                  <span
                    className={`w-1 h-1 rounded-full mb-0.5 transition-all duration-300 ${
                      isActive
                        ? 'bg-brand-primary dark:bg-brand-primary-light scale-100 shadow-[0_0_6px_rgba(99,102,241,0.6)]'
                        : 'bg-transparent scale-0'
                    }`}
                  />
                  <item.icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]' : ''
                    }`}
                  />
                  <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button - opens sidebar */}
          <button
            onClick={onOpenSidebar}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl min-w-[3.5rem] text-slate-500 dark:text-gray-400 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span className="w-1 h-1 rounded-full mb-0.5 bg-transparent scale-0" />
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-tight">More</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
