import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setShow(false);
    }, 2200);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0F]"
        >
          {/* Ambient Background Glow */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[120px] animate-pulse pointer-events-none" />

          {/* Logo & Brand Container */}
          <div className="relative flex flex-col items-center gap-6 z-10 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1], // Custom premium ease-out
                delay: 0.1,
              }}
              className="relative flex items-center justify-center"
            >
              {/* Logo Glow */}
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl opacity-75 animate-pulse" />
              <img
                src="/Gemini_Generated_Image_8ab5bh8ab5bh8ab5.png"
                alt="Trackom Logo"
                className="relative max-w-full h-auto max-h-[140px] sm:max-h-[180px] object-contain"
              />
            </motion.div>

            {/* Glowing progress line */}
            <div className="relative w-48 h-[2px] bg-white/10 rounded-full overflow-hidden mt-4">
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
                className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent shadow-[0_0_8px_#2563EB]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
