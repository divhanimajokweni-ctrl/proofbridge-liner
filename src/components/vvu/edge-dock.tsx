'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff, GripVertical, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DockPosition = 'left' | 'right' | 'top' | 'bottom';

export interface EdgeDockProps {
  /** Which edge the dock is attached to */
  position: DockPosition;
  /** Whether the dock is pinned (stays open without hover) */
  pinned: boolean;
  /** Whether the dock is visible at all */
  visible: boolean;
  /** Width (left/right) or height (top/bottom) in pixels */
  size: number;
  /** Callback when pinned state changes */
  onPinChange: (pinned: boolean) => void;
  /** Callback when size changes (resize) */
  onSizeChange: (size: number) => void;
  /** Callback when visibility changes */
  onVisibleChange: (visible: boolean) => void;
  /** Dock content */
  children: React.ReactNode;
  /** Optional label for the dock (shown in header) */
  label?: string;
  /** Whether focus mode is active (hides non-pinned docks) */
  focusMode?: boolean;
  /** Whether the dock should auto-hide when focus mode is active */
  hideInFocusMode?: boolean;
  /** Minimum size in pixels */
  minSize?: number;
  /** Maximum size in pixels */
  maxSize?: number;
  /** Proximity zone width in pixels (default 25) */
  proximityZone?: number;
  /** Class name for the dock panel */
  className?: string;
  /** Custom style for the dock panel */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Proximity Detection Hook
// ---------------------------------------------------------------------------

function useProximityDetection(
  position: DockPosition,
  proximityZone: number,
  enabled: boolean,
) {
  const [isNear, setIsNear] = useState(false);
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef(0);
  const enabledRef = useRef(enabled);

  // Keep the ref in sync via effect
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!enabledRef.current) return;

      const now = performance.now();
      // Throttle to ~60fps
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        let near = false;
        switch (position) {
          case 'left':
            near = e.clientX < proximityZone;
            break;
          case 'right':
            near = e.clientX > window.innerWidth - proximityZone;
            break;
          case 'top':
            near = e.clientY < proximityZone;
            break;
          case 'bottom':
            near = e.clientY > window.innerHeight - proximityZone;
            break;
        }
        setIsNear(near);
      });
    };

    const handleMouseLeave = () => {
      if (!enabledRef.current) return;
      setIsNear(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [position, proximityZone]);

  // When not enabled, always return false (don't reset state in effect)
  return enabled ? isNear : false;
}

// ---------------------------------------------------------------------------
// Resize Hook
// ---------------------------------------------------------------------------

function useDockResize(
  position: DockPosition,
  initialSize: number,
  minSize: number,
  maxSize: number,
  onSizeChange: (size: number) => void,
) {
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(initialSize);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startPosRef.current = position === 'left' || position === 'right' ? clientX : clientY;
      startSizeRef.current = initialSize;

      const handleMove = (ev: MouseEvent | TouchEvent) => {
        const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
        const delta =
          position === 'left'
            ? cx - startPosRef.current
            : position === 'right'
              ? startPosRef.current - cx
              : position === 'top'
                ? cy - startPosRef.current
                : startPosRef.current - cy;

        const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
        onSizeChange(newSize);
      };

      const handleUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
      };

      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    },
    [position, initialSize, minSize, maxSize, onSizeChange],
  );

  return { isResizing, handleResizeStart };
}

// ---------------------------------------------------------------------------
// Edge Dock Component
// ---------------------------------------------------------------------------

export function EdgeDock({
  position,
  pinned,
  visible,
  size,
  onPinChange,
  onSizeChange,
  onVisibleChange,
  children,
  label,
  focusMode = false,
  hideInFocusMode = false,
  minSize = 48,
  maxSize = 600,
  proximityZone = 25,
  className,
  style,
}: EdgeDockProps) {
  // Proximity detection — only active when not pinned and not in focus mode suppression
  const proximityEnabled = !pinned && visible && !(focusMode && hideInFocusMode);
  const isNear = useProximityDetection(position, proximityZone, proximityEnabled);

  // Resize handling
  const { isResizing, handleResizeStart } = useDockResize(
    position,
    size,
    minSize,
    maxSize,
    onSizeChange,
  );

  // Whether the dock is currently "open" (showing content)
  const isOpen = pinned || isNear || isResizing;

  // If focus mode is active and this dock should hide, don't render
  const shouldHide = focusMode && hideInFocusMode && !pinned;

  // Animation variants based on position
  const getVariants = () => {
    switch (position) {
      case 'left':
        return {
          open: { x: 0, opacity: 1 },
          closed: { x: '-100%', opacity: 0 },
        };
      case 'right':
        return {
          open: { x: 0, opacity: 1 },
          closed: { x: '100%', opacity: 0 },
        };
      case 'top':
        return {
          open: { y: 0, opacity: 1 },
          closed: { y: '-100%', opacity: 0 },
        };
      case 'bottom':
        return {
          open: { y: 0, opacity: 1 },
          closed: { y: '100%', opacity: 0 },
        };
    }
  };

  // Position styles
  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 40,
    };

    if (position === 'left' || position === 'right') {
      base.top = 0;
      base.bottom = 0;
      base.width = size;
      if (position === 'left') base.left = 0;
      else base.right = 0;
    } else {
      base.left = 0;
      base.right = 0;
      base.height = size;
      if (position === 'top') base.top = 0;
      else base.bottom = 0;
    }

    return base;
  };

  // Resize handle position
  const getResizeHandle = () => {
    const isHorizontal = position === 'left' || position === 'right';
    const GripIcon = isHorizontal ? GripVertical : GripHorizontal;

    let handleStyle: React.CSSProperties = {};
    let handlePosition = '';

    switch (position) {
      case 'left':
        handlePosition = 'right';
        handleStyle = { right: -4, top: '50%', transform: 'translateY(-50%)' };
        break;
      case 'right':
        handlePosition = 'left';
        handleStyle = { left: -4, top: '50%', transform: 'translateY(-50%)' };
        break;
      case 'top':
        handlePosition = 'bottom';
        handleStyle = { bottom: -4, left: '50%', transform: 'translateX(-50%)' };
        break;
      case 'bottom':
        handlePosition = 'top';
        handleStyle = { top: -4, left: '50%', transform: 'translateX(-50%)' };
        break;
    }

    return (
      <div
        className={cn(
          'absolute z-50 flex items-center justify-center',
          'cursor-col-resize' && isHorizontal ? 'cursor-col-resize' : 'cursor-row-resize',
          'group/handle',
        )}
        style={{
          ...handleStyle,
          width: isHorizontal ? 12 : '100%',
          height: isHorizontal ? '100%' : 12,
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
        }}
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
      >
        <GripIcon
          className={cn(
            'h-3 w-3 text-muted-foreground/30 transition-colors',
            'group-hover/handle:text-muted-foreground/70',
            isResizing && 'text-emerald-500',
          )}
        />
      </div>
    );
  };

  // Glow effect when cursor is near
  const getGlowStyle = (): React.CSSProperties => {
    if (!isNear || isOpen || pinned) return { opacity: 0 };

    const glow: React.CSSProperties = {
      position: 'absolute',
      opacity: 1,
      transition: 'opacity 150ms ease',
      pointerEvents: 'none',
    };

    switch (position) {
      case 'left':
        glow.left = 0;
        glow.top = 0;
        glow.bottom = 0;
        glow.width = 3;
        glow.background = 'linear-gradient(180deg, transparent, #10b981, transparent)';
        glow.boxShadow = '0 0 12px rgba(16,185,129,0.5)';
        break;
      case 'right':
        glow.right = 0;
        glow.top = 0;
        glow.bottom = 0;
        glow.width = 3;
        glow.background = 'linear-gradient(180deg, transparent, #10b981, transparent)';
        glow.boxShadow = '0 0 12px rgba(16,185,129,0.5)';
        break;
      case 'top':
        glow.top = 0;
        glow.left = 0;
        glow.right = 0;
        glow.height = 3;
        glow.background = 'linear-gradient(90deg, transparent, #10b981, transparent)';
        glow.boxShadow = '0 0 12px rgba(16,185,129,0.5)';
        break;
      case 'bottom':
        glow.bottom = 0;
        glow.left = 0;
        glow.right = 0;
        glow.height = 3;
        glow.background = 'linear-gradient(90deg, transparent, #10b981, transparent)';
        glow.boxShadow = '0 0 12px rgba(16,185,129,0.5)';
        break;
    }

    return glow;
  };

  if (!visible && !shouldHide) {
    // Still render the proximity zone even when not visible
    return (
      <>
        {isNear && (
          <div style={getGlowStyle()} />
        )}
      </>
    );
  }

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Proximity glow indicator */}
      <div style={getGlowStyle()} />

      {/* Dock panel */}
      <AnimatePresence>
        {(isOpen || pinned) && (
          <motion.div
            initial={getVariants().closed}
            animate={getVariants().open}
            exit={getVariants().closed}
            transition={{
              duration: 0.15,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ ...getPositionStyles(), ...style }}
            className={cn(
              'flex flex-col overflow-hidden border-white/[0.06] backdrop-blur-xl',
              position === 'left' && 'border-r',
              position === 'right' && 'border-l',
              position === 'top' && 'border-b',
              position === 'bottom' && 'border-t',
              isResizing && 'select-none',
              className,
            )}
            data-dock-position={position}
          >
            {/* Dock header with pin/unpin and label */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
              {label && (
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {label}
                </span>
              )}
              {!label && <div />}
              <button
                onClick={() => onPinChange(!pinned)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-1.5 py-1 font-mono text-[9px] transition-colors',
                  pinned
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground',
                )}
                title={pinned ? 'Unpin dock' : 'Pin dock'}
              >
                {pinned ? (
                  <Pin className="h-2.5 w-2.5" />
                ) : (
                  <PinOff className="h-2.5 w-2.5" />
                )}
                {pinned ? 'Pinned' : 'Auto'}
              </button>
            </div>

            {/* Dock content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>

            {/* Resize handle */}
            {getResizeHandle()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
