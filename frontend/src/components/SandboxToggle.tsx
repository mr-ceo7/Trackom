/**
 * SandboxToggle - Premium pill-shaped toggle for switching between Sandbox and Live modes.
 * Shows confirmation dialog when switching to Live mode.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlaskConical, Radio, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SandboxToggle() {
  const { user, toggleSandboxMode } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  if (!user) return null;

  const isSandbox = user.sandbox_mode !== false; // default true

  const handleToggle = async () => {
    if (isSandbox) {
      // Switching to Live → show confirmation
      setConfirmOpen(true);
    } else {
      // Switching to Sandbox → no confirmation needed
      setIsToggling(true);
      try {
        await toggleSandboxMode();
        window.location.reload();
      } finally {
        setIsToggling(false);
      }
    }
  };

  const handleConfirmLive = async () => {
    setConfirmOpen(false);
    setIsToggling(true);
    try {
      await toggleSandboxMode();
      window.location.reload();
    } finally {
      setIsToggling(false);
    }
  };


  return (
    <>
      <div
        onClick={handleToggle}
        className={`
          relative flex items-center p-0.5 rounded-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/20 dark:border-white/5 cursor-pointer select-none h-8 w-16 sm:w-36 transition-all
          ${isToggling ? 'opacity-60 pointer-events-none' : ''}
        `}
        aria-label={isSandbox ? 'Switch to Live mode' : 'Switch to Sandbox mode'}
      >
        {/* Sliding background */}
        <motion.div
          className={`absolute top-0.5 bottom-0.5 rounded-full shadow-sm ${
            isSandbox 
              ? 'bg-amber-500/20 border border-amber-500/30' 
              : 'bg-emerald-500/20 border border-emerald-500/30'
          }`}
          layout
          initial={false}
          animate={{
            left: isSandbox ? '2px' : '50%',
            right: isSandbox ? '50%' : '2px',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />

        {/* Sandbox Option */}
        <div className={`relative flex-1 flex items-center justify-center gap-1.5 z-10 text-[10px] font-bold transition-colors ${
          isSandbox 
            ? 'text-amber-600 dark:text-amber-400' 
            : 'text-slate-500 dark:text-gray-400'
        }`}>
          <FlaskConical className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Sandbox</span>
        </div>

        {/* Live Option */}
        <div className={`relative flex-1 flex items-center justify-center gap-1.5 z-10 text-[10px] font-bold transition-colors ${
          !isSandbox 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : 'text-slate-500 dark:text-gray-400'
        }`}>
          <Radio className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Live</span>
          {!isSandbox && (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Modal for switching to Live */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[101] p-4"
            >
              <div className="rounded-2xl clay-card shadow-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                      Switch to Live mode?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Real SMS will be sent and credits will be deducted.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLive}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer shadow-md"
                  >
                    Go Live
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
