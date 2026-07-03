import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() => {
    // Check system preference on first load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackom-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      html.style.colorScheme = 'light';
    }
    localStorage.setItem('trackom-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      id="theme-toggle"
      onClick={() => setIsDark(!isDark)}
      className={`flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden cursor-pointer ${className}`}
      aria-label="Toggle visual theme"
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        <span
          className={`absolute transition-all duration-400 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100 text-amber-400' : 'rotate-90 scale-0 opacity-0'
          }`}
        >
          <Sun size={18} className="stroke-[2]" />
        </span>
        <span
          className={`absolute transition-all duration-400 transform ${
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-slate-700'
          }`}
        >
          <Moon size={18} className="stroke-[2]" />
        </span>
      </div>
    </button>
  );
}
