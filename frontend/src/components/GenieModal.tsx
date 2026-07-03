import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, usePresence } from 'motion/react';

// Track the coordinates and bounding rect of the last clicked interactive element
let lastClickRect: DOMRect | null = null;
let lastClickCoords: { x: number; y: number } | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => {
    lastClickCoords = { x: e.clientX, y: e.clientY };
    const target = e.target as HTMLElement;
    const interactive = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"]');
    if (interactive) {
      lastClickRect = interactive.getBoundingClientRect();
    } else {
      lastClickRect = null;
    }
  }, true);
}

function getTriggerRect(): DOMRect {
  if (lastClickRect) {
    return lastClickRect;
  }
  if (typeof document !== 'undefined' && document.activeElement) {
    const active = document.activeElement as HTMLElement;
    if (active.matches('button, a, [role="button"], input[type="submit"], input[type="button"]')) {
      return active.getBoundingClientRect();
    }
  }
  if (lastClickCoords) {
    return {
      left: lastClickCoords.x - 20,
      top: lastClickCoords.y - 20,
      right: lastClickCoords.x + 20,
      bottom: lastClickCoords.y + 20,
      width: 40,
      height: 40,
      x: lastClickCoords.x - 20,
      y: lastClickCoords.y - 20,
      toJSON: () => {},
    } as DOMRect;
  }
  if (typeof window !== 'undefined') {
    return {
      left: window.innerWidth / 2 - 20,
      top: window.innerHeight - 80,
      right: window.innerWidth / 2 + 20,
      bottom: window.innerHeight - 40,
      width: 40,
      height: 40,
      x: window.innerWidth / 2 - 20,
      y: window.innerHeight - 80,
      toJSON: () => {},
    } as DOMRect;
  }
  return {
    left: 0,
    top: 0,
    right: 40,
    bottom: 40,
    width: 40,
    height: 40,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect;
}

interface GenieModalProps {
  onClose: () => void;
  as?: 'div' | 'form';
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  overlayClassName?: string;
  children: React.ReactNode;
}

export default function GenieModal({
  onClose,
  as = 'div',
  onSubmit,
  className = '',
  overlayClassName = '',
  children,
  ...props
}: GenieModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isPresent, safeToRemove] = usePresence();
  
  // 0 = closed/sucked at trigger, 1 = fully open at center
  const progress = useMotionValue(0);

  // Compute button center coordinates
  const buttonRect = getTriggerRect();
  const buttonCX = buttonRect.left + buttonRect.width / 2;
  const buttonCY = buttonRect.top + buttonRect.height / 2;
  
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Translate from button center relative to viewport center
  const initialX = buttonCX - viewportW / 2;
  const initialY = buttonCY - viewportH / 2;

  // GPU-accelerated motion transforms (eliminates laggy clipPath calculations)
  const x = useTransform(progress, [0, 1], [initialX, 0]);
  const y = useTransform(progress, [0, 1], [initialY, 0]);
  const scaleX = useTransform(progress, [0, 1], [0.02, 1]);
  const scaleY = useTransform(progress, [0, 1], [0.02, 1]);
  const opacity = useTransform(progress, [0, 0.15, 1], [0, 1, 1]);
  const contentOpacity = useTransform(progress, [0, 0.35, 1], [0, 0, 1]);

  // Rotational swing to simulate movement weight
  const rotate = useTransform(progress, [0, 0.5, 1], [
    initialX < 0 ? -6 : 6,
    initialX < 0 ? -1.5 : 1.5,
    0
  ]);

  useEffect(() => {
    if (isPresent) {
      progress.set(0);
      const controls = animate(progress, 1, {
        duration: 0.52,
        ease: [0.34, 1.56, 0.64, 1], // macOS-like elastic overshoot
      });
      return () => controls.stop();
    } else {
      const controls = animate(progress, 0, {
        duration: 0.38,
        ease: [0.25, 1, 0.5, 1],
        onComplete: () => {
          safeToRemove();
        },
      });
      return () => controls.stop();
    }
  }, [isPresent]);

  const Component = as as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm ${overlayClassName}`}
      />

      {/* Warp/Genie container card */}
      <motion.div
        ref={modalRef}
        style={{
          x,
          y,
          scaleX,
          scaleY,
          rotate,
          opacity,
        }}
        className="w-full max-w-md relative z-10 text-left"
      >
        <Component
          onSubmit={onSubmit}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className={`clay-card rounded-3xl dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
          {...props}
        >
          <motion.div style={{ opacity: contentOpacity }} className="w-full h-full">
            {children}
          </motion.div>
        </Component>
      </motion.div>
    </div>
  );
}
