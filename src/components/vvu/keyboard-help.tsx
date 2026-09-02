'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Keyboard shortcut help modal — opens with the `?` key, closes with `?` or Esc.

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; label: string; color: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'FSM Controls',
    shortcuts: [
      { key: 'T', label: 'Simulate thermal throttle (78°C)', color: '#E0944A' },
      { key: 'C', label: 'Simulate critical failure (88°C)', color: '#E27373' },
      { key: 'R', label: 'Authorised reset from FAIL_CLOSED', color: '#9DB36B' },
      { key: 'L', label: 'Toggle leak on Pressure Pipe node', color: '#C46D1A' },
    ],
  },
  {
    title: 'Dashboard',
    shortcuts: [
      { key: '?', label: 'Toggle this help modal', color: '#F3E38A' },
      { key: 'Esc', label: 'Close any open modal / dialog', color: '#8B9A7B' },
      { key: '1 / 2 / 3', label: 'Switch RLS tenant (Gqeberha / Anglo / Sibanye)', color: '#9DB36B' },
    ],
  },
  {
    title: 'Accessibility',
    shortcuts: [
      { key: 'Tab', label: 'Move focus between interactive elements', color: '#8B9A7B' },
      { key: 'Enter / Space', label: 'Activate focused node pin or button', color: '#8B9A7B' },
    ],
  },
];

interface KeyboardHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardHelp({ open, onClose }: KeyboardHelpProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 85,
        background: 'rgba(6, 8, 6, 0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        animation: 'vvuHelpIn 200ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 20, 16, 0.98)',
          border: '1px solid rgba(107, 138, 64, 0.3)',
          borderRadius: 12,
          padding: '1.2rem 1.4rem',
          width: 'min(520px, 100%)',
          maxHeight: '85vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.78rem',
              letterSpacing: '0.16em',
              color: '#F3E38A',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            aria-label="Close help"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8B9A7B',
              cursor: 'pointer',
              padding: 4,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {GROUPS.map((g) => (
          <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.6rem',
                color: '#6B8A40',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(107,138,64,0.15)',
                paddingBottom: '0.3rem',
              }}
            >
              {g.title}
            </div>
            {g.shortcuts.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  padding: '0.25rem 0',
                }}
              >
                <kbd
                  style={{
                    minWidth: 36,
                    textAlign: 'center',
                    padding: '0.15rem 0.4rem',
                    borderRadius: 4,
                    background: `${s.color}1a`,
                    border: `1px solid ${s.color}55`,
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: s.color,
                  }}
                >
                  {s.key}
                </kbd>
                <span
                  style={{
                    fontFamily: 'var(--font-geist-sans), sans-serif',
                    fontSize: '0.72rem',
                    color: '#C9D4BD',
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes vvuHelpIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// Hook that manages the help modal open state + the `?` / `Esc` key binding.
export function useKeyboardHelp() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen, HelpModal: KeyboardHelp };
}
