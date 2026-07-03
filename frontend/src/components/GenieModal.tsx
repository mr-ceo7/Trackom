import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, usePresence } from 'motion/react';

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
  // Fallback to active element if it's interactive
  if (typeof document !== 'undefined' && document.activeElement) {
    const active = document.activeElement as HTMLElement;
    if (active.matches('button, a, [role="button"], input[type="submit"], input[type="button"]')) {
      return active.getBoundingClientRect();
    }
  }
  // Fallback to click coordinates
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
  // Ultimate fallback: bottom center of screen (macOS dock-like position)
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
  const [rects, setRects] = useState<{ modal: DOMRect; button: DOMRect } | null>(null);
  const [isPresent, safeToRemove] = usePresence();
  
  // 0 = closed/sucked, 1 = fully open
  const progress = useMotionValue(0);

  // Measure the modal and button on mount
  useLayoutEffect(() => {
    if (modalRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      const buttonRect = getTriggerRect();
      setRects({ modal: modalRect, button: buttonRect });
    }
  }, []);

  // Entrance and Exit animations
  useEffect(() => {
    if (!rects) return;

    if (isPresent) {
      // Animate from 0 to 1 (Open)
      progress.set(0);
      const controls = animate(progress, 1, {
        duration: 0.48,
        ease: [0.34, 1.56, 0.64, 1], // macOS-like elastic overshoot curve
      });
      return () => controls.stop();
    } else {
      // Animate from 1 to 0 (Close)
      const controls = animate(progress, 0, {
        duration: 0.36,
        ease: [0.25, 1, 0.5, 1],
        onComplete: () => {
          safeToRemove();
        },
      });
      return () => controls.stop();
    }
  }, [isPresent, rects]);

  // Compute transform origin relative to the modal
  let originX = 50;
  let originY = 50;
  let scaleXInitial = 0.05;
  let scaleYInitial = 0.05;
  let p1 = 1.5, p2 = 1.5, p3 = 1.5, p4 = 1.5;

  if (rects) {
    const buttonCX = rects.button.left + rects.button.width / 2;
    const buttonCY = rects.button.top + rects.button.height / 2;
    
    // Relative coordinates of the button center in terms of modal dimensions (0 to 100)
    originX = ((buttonCX - rects.modal.left) / rects.modal.width) * 100;
    originY = ((buttonCY - rects.modal.top) / rects.modal.height) * 100;
    
    // Prevent Division by Zero
    const btnW = Math.max(rects.button.width, 30);
    const btnH = Math.max(rects.button.height, 20);
    scaleXInitial = btnW / rects.modal.width;
    scaleYInitial = btnH / rects.modal.height;

    // Calculate distance of corners to button center to calculate lag
    const d1 = Math.hypot(0 - originX, 0 - originY);
    const d2 = Math.hypot(100 - originX, 0 - originY);
    const d3 = Math.hypot(100 - originX, 100 - originY);
    const d4 = Math.hypot(0 - originX, 100 - originY);
    
    const dMin = Math.min(d1, d2, d3, d4);
    const dMax = Math.max(d1, d2, d3, d4);
    const dDiff = dMax - dMin || 1;

    // Distant corners lag more (higher exponent), closer corners snap faster
    p1 = 1.2 + 2.8 * ((d1 - dMin) / dDiff);
    p2 = 1.2 + 2.8 * ((d2 - dMin) / dDiff);
    p3 = 1.2 + 2.8 * ((d3 - dMin) / dDiff);
    p4 = 1.2 + 2.8 * ((d4 - dMin) / dDiff);
  }

  // Dynamic Scale values mapped from progress (0 to 1) dynamically reading state updates
  const scaleX = useTransform(progress, (val) => scaleXInitial + (1 - scaleXInitial) * val);
  const scaleY = useTransform(progress, (val) => scaleYInitial + (1 - scaleYInitial) * val);

  // Content opacity: invisible during high-warp start, fades in smoothly to prevent layout squishing
  const contentOpacity = useTransform(progress, [0, 0.35, 1], [0, 0, 1]);

  // Dynamic rotation and skew to create a natural floating swing path
  const rotate = useTransform(progress, [0, 0.5, 1], [
    originX < 50 ? -5 : 5,
    originX < 50 ? -1 : 1,
    0
  ]);

  const skewX = useTransform(progress, [0, 0.6, 1], [
    originX < 50 ? 4 : -4,
    originX < 50 ? 1 : -1,
    0
  ]);

  // Dynamic clip-path polygon warping
  const clipPath = useTransform(progress, (val) => {
    // Interpolate corners towards the target origin based on progress (val)
    // Corner 1: top-left (0, 0)
    const c1x = originX + (0 - originX) * Math.pow(val, p1);
    const c1y = originY + (0 - originY) * Math.pow(val, p1);

    // Corner 2: top-right (100, 0)
    const c2x = originX + (100 - originX) * Math.pow(val, p2);
    const c2y = originY + (0 - originY) * Math.pow(val, p2);

    // Corner 3: bottom-right (100, 100)
    const c3x = originX + (100 - originX) * Math.pow(val, p3);
    const c3y = originY + (100 - originY) * Math.pow(val, p3);

    // Corner 4: bottom-left (0, 100)
    const c4x = originX + (0 - originX) * Math.pow(val, p4);
    const c4y = originY + (100 - originY) * Math.pow(val, p4);

    return `polygon(${c1x}% ${c1y}%, ${c2x}% ${c2y}%, ${c3x}% ${c3y}%, ${c4x}% ${c4y}%)`;
  });

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
        style={rects ? {
          transformOrigin: `${originX}% ${originY}%`,
          scaleX,
          scaleY,
          rotate,
          skewX,
          clipPath,
          opacity: 1,
        } : {
          opacity: 0,
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
