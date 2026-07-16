'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { dispatch, complete } from '@/lib/air/commands';
interface OutputLine {
  type: 'input' | 'output' | 'boot' | 'error';
  content: string;
}
interface PagerPayload {
  header: string;
  body: string;
  footer: string;
}
type Theme = 'green' | 'amber' | 'white';
const BOOT_LINES: string[] = [
  '╔══════════════════════════════════════════════════════════╗',
  '║                 VVU AIR v3.1.0 — TRUST LAYER            ║',
  '╚══════════════════════════════════════════════════════════╝',
  '',
  '[BOOT] Initializing ProofBridge trust substrate...',
  '[BOOT] Loading kernel runtime environment...',
  '[BOOT] Verifying hardware attestation (AMD SEV-SNP)...',
  '[BOOT] SGX enclave status: OK',
  '[BOOT] AWS Nitro attestation: OK',
  '[BOOT] Loading execution runtimes...',
  '[BOOT]   ├─ policy-engine .............. loaded',
  '[BOOT]   ├─ evidence-collector ......... loaded',
  '[BOOT]   ├─ receipt-writer ............. loaded',
  '[BOOT]   └─ bayesian-trust-model ....... loaded',
  '[BOOT] Checking evidence store (/var/lib/vvu/evidence)...',
  '[BOOT]   Evidence leaves: 1,247',
  '[BOOT]   Snapshot count:  89',
  '[BOOT]   Last settlement: 2026-07-16T08:00:00Z',
  '[BOOT] Constitutional gate status: PASS',
  '[BOOT]   Required predicates: 12/12 satisfied',
  '[BOOT]   Deny-list check: clean',
  '[BOOT] Loading policy set (94 rules)...',
  '[BOOT] Connecting to VVU trust network...',
  '[BOOT]   Peer count: 42 online',
  '[BOOT]   Consensus round: stable',
  '[BOOT] Bayesian prior: μ=0.87 σ=0.11',
  '[BOOT] All subsystems nominal.',
  '[BOOT] Terminal ready. Type "help" for available commands.',
  '',
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
];
const THEME_VARS: Record<Theme, Record<string, string>> = {
  green: {
    '--crt-text': '#33ff33',
    '--crt-dim': '#1a8c1a',
    '--crt-glow': 'rgba(51,255,51,0.15)',
    '--crt-bg': '#0a0a0a',
    '--crt-header': '#22cc22',
  },
  amber: {
    '--crt-text': '#ffb000',
    '--crt-dim': '#8c6000',
    '--crt-glow': 'rgba(255,176,0,0.15)',
    '--crt-bg': '#0a0a0a',
    '--crt-header': '#cc8800',
  },
  white: {
    '--crt-text': '#ffffff',
    '--crt-dim': '#888888',
    '--crt-glow': 'rgba(255,255,255,0.12)',
    '--crt-bg': '#0a0a0a',
    '--crt-header': '#dddddd',
  },
};
let audioCtx: AudioContext | null = null;
function playKeyClick() {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return;
    }
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.03);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
}
function nowTimeString(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
export default function AirTerminal() {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState('');
  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>('green');
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pager, setPager] = useState<PagerPayload | null>(null);
  const [pagerScroll, setPagerScroll] = useState(0);
  const [gateStatus, setGateStatus] = useState('PASS');
  const [clock, setClock] = useState(nowTimeString());
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const [ghostText, setGhostText] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagerRef = useRef<HTMLDivElement>(null);
  const bootIndexRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => setClock(nowTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);
  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [output, bootLines, scrollToBottom]);
  useEffect(() => {
    if (!booting) {
      inputRef.current?.focus();
    }
  }, [booting]);
  useEffect(() => {
    if (!booting) return;
    const timer = setInterval(() => {
      if (bootIndexRef.current < BOOT_LINES.length) {
        const line = BOOT_LINES[bootIndexRef.current];
        setBootLines((prev) => [...prev, line]);
        bootIndexRef.current += 1;
      } else {
        clearInterval(timer);
        setOutput((prev) =>
          prev.concat(
            BOOT_LINES.map((l) => ({ type: 'boot' as const, content: l }))
          )
        );
        setBooting(false);
        bootIndexRef.current = 0;
      }
    }, 160);
    return () => clearInterval(timer);
  }, [booting]);
  useEffect(() => {
    if (!pager) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'q' || e.key === 'Escape') {
        setPager(null);
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowDown') {
        setPagerScroll((s) => Math.min(s + 1, 9999));
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        setPagerScroll((s) => Math.max(s - 1, 0));
      }
      if (e.key === ' ') {
        setPagerScroll((s) => s + 30);
      }
      if (e.key === 'b') {
        setPagerScroll((s) => Math.max(s - 30, 0));
      }
      if (e.key === 'g') {
        setPagerScroll(0);
      }
      if (e.key === 'G') {
        setPagerScroll(99999);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [pager]);
  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      setTabSuggestions([]);
      setGhostText('');
      setOutput((prev) => [
        ...prev,
        { type: 'input', content: `vvu-air@3.1.0 ~ $ ${trimmed}` },
      ]);
      if (trimmed === '') return;
      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
      const lower = trimmed.toLowerCase();
      if (lower === 'theme green') {
        setTheme('green');
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'Theme set to green phosphor.' },
        ]);
        return;
      }
      if (lower === 'theme amber') {
        setTheme('amber');
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'Theme set to amber phosphor.' },
        ]);
        return;
      }
      if (lower === 'theme white') {
        setTheme('white');
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'Theme set to white phosphor.' },
        ]);
        return;
      }
      if (lower === 'crt on') {
        setCrtEnabled(true);
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'CRT effects enabled.' },
        ]);
        return;
      }
      if (lower === 'crt off') {
        setCrtEnabled(false);
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'CRT effects disabled.' },
        ]);
        return;
      }
      if (lower === 'sound on') {
        setSoundEnabled(true);
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'Keyboard sounds enabled.' },
        ]);
        return;
      }
      if (lower === 'sound off') {
        setSoundEnabled(false);
        setOutput((prev) => [
          ...prev,
          { type: 'output', content: 'Keyboard sounds disabled.' },
        ]);
        return;
      }
      if (lower === 'clear') {
        setOutput([]);
        return;
      }
      if (lower === 'exit') {
        setOutput((prev) => [
          ...prev,
          { type: 'error', content: 'Cannot exit. Trust layer is always on.' },
        ]);
        return;
      }
      try {
        const result = dispatch(trimmed);
        if (result.pager) {
          setPager(result.pager);
          setPagerScroll(0);
        }
        if (result.output) {
          setOutput((prev) =>
            prev.concat(
              result.output.split('\n').filter(Boolean).map((l) => ({
                type: 'output' as const,
                content: l,
              }))
            )
          );
        }
        // gateStatus not in CommandResult — skip
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setOutput((prev) => [
          ...prev,
          { type: 'error', content: `Error: ${msg}` },
        ]);
      }
    },
    []
  );
  const handleTabComplete = useCallback(
    (partial: string) => {
      if (!partial) return;
      try {
        const suggestions = complete(partial);
        if (suggestions.length === 0) return;
        if (suggestions.length === 1) {
          setInput(suggestions[0]);
          setTabSuggestions([]);
          setGhostText('');
        } else {
          setTabSuggestions(suggestions);
          const common = suggestions.reduce((a, b) => {
            let i = 0;
            while (i < a.length && i < b.length && a[i] === b[i]) i++;
            return a.slice(0, i);
          });
          setGhostText(common.length > partial.length ? common : '');
          setOutput((prev) => [
            ...prev,
            { type: 'output', content: suggestions.join('  ') },
          ]);
        }
      } catch {
        // silently ignore completion failures
      }
    },
    []
  );
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (soundEnabled) playKeyClick();
      if (e.key === 'Tab') {
        e.preventDefault();
        handleTabComplete(input);
        return;
      }
      setTabSuggestions([]);
      setGhostText('');
      if (e.key === 'Enter') {
        e.preventDefault();
        processCommand(input);
        setInput('');
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        const newIndex =
          historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) return;
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
        return;
      }
      if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        setOutput((prev) => [
          ...prev,
          { type: 'input', content: `vvu-air@3.1.0 ~ $ ${input}^C` },
        ]);
        setInput('');
        setHistoryIndex(-1);
        return;
      }
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        setOutput([]);
        return;
      }
    },
    [input, history, historyIndex, processCommand, handleTabComplete, soundEnabled]
  );
  const themeStyle = THEME_VARS[theme];
  return (
    <div
      className="air-terminal"
      data-theme={theme}
      data-crt={crtEnabled ? 'on' : 'off'}
      style={{
        ...themeStyle,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: '14px',
        backgroundColor: 'var(--crt-bg)',
        color: 'var(--crt-text)',
        overflow: 'hidden',
        transition: 'color 200ms ease, background-color 200ms ease',
      }}
    >
      {crtEnabled && (
        <div
          className="crt-scanlines"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
            backgroundSize: '100% 2px',
          }}
        />
      )}
      {crtEnabled && (
        <div
          className="crt-glow"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 11,
            boxShadow: 'inset 0 0 60px var(--crt-glow)',
          }}
        />
      )}
      <div
        className="crt-vignette"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 12,
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      <div
        ref={outputRef}
        className="air-output"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          paddingBottom: '4px',
          position: 'relative',
          zIndex: 5,
          scrollBehavior: 'smooth',
        }}
      >
        {output.map((line, i) => (
          <div
            key={i}
            className={`air-line air-${line.type}`}
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.5',
              color:
                line.type === 'error'
                  ? '#ff4444'
                  : line.type === 'input'
                  ? 'var(--crt-header)'
                  : line.type === 'boot'
                  ? 'var(--crt-dim)'
                  : 'var(--crt-text)',
              minHeight: '1.5em',
            }}
          >
            {line.content}
          </div>
        ))}
      </div>
      {!booting && (
        <div
          className="air-input-line"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 16px',
            position: 'relative',
            zIndex: 5,
          }}
        >
          <span
            className="air-prompt"
            style={{
              color: 'var(--crt-header)',
              marginRight: '8px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            vvu-air@3.1.0 ~ $
          </span>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              className="air-cmd-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setGhostText('');
                setTabSuggestions([]);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--crt-text)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                width: '100%',
                caretColor: 'var(--crt-text)',
              }}
            />
            {ghostText && input && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  pointerEvents: 'none',
                  color: 'var(--crt-dim)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  whiteSpace: 'pre',
                }}
              >
                {ghostText.slice(input.length)}
              </span>
            )}
          </div>
        </div>
      )}
      {tabSuggestions.length > 1 && !booting && (
        <div
          className="air-tab-suggestions"
          style={{
            padding: '2px 16px',
            position: 'relative',
            zIndex: 5,
            color: 'var(--crt-dim)',
            fontSize: '13px',
          }}
        >
          {tabSuggestions.join('  ')}
        </div>
      )}
      {pager && (
        <div
          className="air-pager-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'inherit',
          }}
        >
          <div
            className="pager-header"
            ref={pagerRef}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--crt-dim)',
              color: 'var(--crt-header)',
              fontWeight: 'bold',
              flexShrink: 0,
              position: 'sticky',
              top: 0,
              backgroundColor: 'rgba(0,0,0,0.98)',
              zIndex: 1,
            }}
          >
            {pager.header}
          </div>
          <div
            className="pager-body"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5',
            }}
          >
            {pager.body}
          </div>
          <div
            className="pager-footer"
            style={{
              padding: '8px 16px',
              borderTop: '1px solid var(--crt-dim)',
              color: 'var(--crt-dim)',
              fontSize: '12px',
              flexShrink: 0,
              backgroundColor: 'rgba(0,0,0,0.98)',
            }}
          >
            {pager.footer || 'Press q to close — j/k scroll — SPACE page down — b page up — g top — G bottom'}
          </div>
        </div>
      )}
      <div
        className="air-status-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 16px',
          borderTop: '1px solid var(--crt-dim)',
          fontSize: '12px',
          color: 'var(--crt-dim)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 5,
          userSelect: 'none',
        }}
      >
        <span>
          theme:{theme} | crt:{crtEnabled ? 'on' : 'off'} | sound:{soundEnabled ? 'on' : 'off'}
        </span>
        <span>gate:{gateStatus}</span>
        <span>{clock}</span>
      </div>
    </div>
  );
}
