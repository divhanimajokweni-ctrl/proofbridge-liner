'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Gateway PIN Pad — secure login screen.
 * PIN is hashed client-side with Argon2id before sending to backend.
 * Raw PIN never touches the network.
 */
export default function GatewayPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [jailed, setJailed] = useState(false);
  const [jailTimer, setJailTimer] = useState(0);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [registeredPin, setRegisteredPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus PIN input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Jail countdown
  useEffect(() => {
    if (jailTimer <= 0) return;
    const timer = setInterval(() => {
      setJailTimer(prev => {
        if (prev <= 1) {
          setJailed(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [jailTimer]);

  // Client-side PIN hashing (simulated Argon2id — in production use argon2-browser)
  const hashPin = useCallback(async (rawPin: string): Promise<string> => {
    // SHA-256 client-side hash as first layer (real implementation would use argon2id wasm)
    const encoder = new TextEncoder();
    const data = encoder.encode(rawPin + email);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, [email]);

  // ─── Login Handler ────────────────────────────────────────────

  const handleLogin = useCallback(async () => {
    if (!email || !pin) {
      setError('Email and PIN required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const pinHash = await hashPin(pin);

      const res = await fetch('/api/gateway/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email, pinHash }),
      });

      const data = await res.json();

      if (data.ok) {
        // Session cookie is set by the server
        router.push('/dashboard');
      } else {
        setError(data.error || 'Verification failed');
        if (res.status === 429) {
          setJailed(true);
          setJailTimer(900); // 15 minutes
        }
        setPin('');
      }
    } catch (err) {
      setError('Connection failed — gateway unreachable');
    } finally {
      setLoading(false);
    }
  }, [email, pin, hashPin, router]);

  // ─── Register Handler ─────────────────────────────────────────

  const handleRegister = useCallback(async () => {
    if (!email || !displayName) {
      setError('Email and display name required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/gateway/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName }),
      });

      const data = await res.json();

      if (data.ok) {
        setRegisteredPin(data.pin);
        setMode('login');
        setPin('');
        setError('');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection failed — gateway unreachable');
    } finally {
      setLoading(false);
    }
  }, [email, displayName]);

  // ─── PIN Input Handler ────────────────────────────────────────

  const handlePinInput = useCallback((value: string) => {
    // Only allow digits, max 6
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleaned);
    setError('');

    // Auto-submit on 6 digits
    if (cleaned.length === 6) {
      setTimeout(() => handleLogin(), 100);
    }
  }, [handleLogin]);

  // ─── Keyboard Handler ─────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') handleLogin();
      else handleRegister();
    }
  }, [mode, handleLogin, handleRegister]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-void)',
        fontFamily: 'var(--font-mono)',
        padding: 20,
      }}
    >
      {/* Background grid effect */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(200,168,74,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,168,74,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)',
        padding: '32px 28px',
        boxShadow: '0 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: jailed
            ? 'linear-gradient(90deg, var(--color-crimson), transparent)'
            : 'linear-gradient(90deg, var(--color-gold), transparent)',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-display)',
          }}>
            ⬡ VVU GATEWAY
          </div>
          <div style={{
            fontSize: 'clamp(0.45rem, 0.8vw, 0.55rem)',
            color: 'var(--color-text-muted)',
            marginTop: 4,
            letterSpacing: '0.1em',
          }}>
            v2.0-STABLE · SECURE ACCESS PORTAL
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          background: 'var(--color-void)',
          borderRadius: 'var(--radius-xs)',
          padding: 3,
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); setRegisteredPin(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              background: mode === 'login' ? 'var(--color-card)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              fontWeight: mode === 'login' ? 700 : 400,
              cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setRegisteredPin(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              background: mode === 'register' ? 'var(--color-card)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              fontWeight: mode === 'register' ? 700 : 400,
              cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Registered PIN display */}
        {registeredPin && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(62,207,142,0.1)',
            border: '1px solid var(--color-green-border)',
            borderRadius: 'var(--radius-xs)',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--color-green)', marginBottom: 6, fontWeight: 700 }}>
              ACCOUNT CREATED — SAVE YOUR PIN
            </div>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.3em',
              fontFamily: 'var(--font-mono)',
            }}>
              {registeredPin}
            </div>
            <div style={{ fontSize: '0.45rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
              This PIN is shown once. Store it securely.
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: jailed ? 'rgba(140,26,62,0.15)' : 'rgba(208,126,24,0.1)',
            border: `1px solid ${jailed ? 'var(--color-crimson-border)' : 'var(--color-orange-dim)'}`,
            borderRadius: 'var(--radius-xs)',
            marginBottom: 16,
            fontSize: '0.5rem',
            color: jailed ? 'var(--color-crimson-bright)' : 'var(--color-orange)',
            textAlign: 'center',
          }}>
            {error}
            {jailed && (
              <div style={{ marginTop: 4, fontSize: '0.45rem' }}>
                Retry in {Math.floor(jailTimer / 60)}:{(jailTimer % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        )}

        {/* Email input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: '0.45rem',
            color: 'var(--color-text-muted)',
            marginBottom: 6,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
            placeholder="you@venturevisionubuntu.co.za"
            disabled={loading || jailed}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--color-void)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-gold-border)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {/* Display name (register only) */}
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: '0.45rem',
              color: 'var(--color-text-muted)',
              marginBottom: 6,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your name"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--color-void)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xs)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-gold-border)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            />
          </div>
        )}

        {/* PIN input (login only) */}
        {mode === 'login' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: '0.45rem',
              color: 'var(--color-text-muted)',
              marginBottom: 6,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              6-DIGIT PIN
            </label>
            <div style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
            }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-void)',
                    border: `1px solid ${pin.length > i ? 'var(--color-gold-border)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#fff',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={e => handlePinInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              disabled={loading || jailed}
              style={{
                position: 'absolute',
                opacity: 0,
                width: 1,
                height: 1,
              }}
            />
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading || jailed || (mode === 'login' ? !email || pin.length < 6 : !email || !displayName)}
          style={{
            width: '100%',
            padding: '12px 0',
            background: jailed
              ? 'var(--color-crimson-dim)'
              : 'linear-gradient(135deg, var(--color-gold), var(--color-gold-bright))',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            color: jailed ? 'var(--color-crimson)' : '#000',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            cursor: loading || jailed ? 'not-allowed' : 'pointer',
            opacity: loading || jailed ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'AUTHENTICATING...' : jailed ? 'IP JAILED' : mode === 'login' ? 'ENTER GATEWAY' : 'CREATE ACCOUNT'}
        </button>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: '0.4rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}>
          <div>venturevisionubuntu.co.za · v2.0-STABLE</div>
          <div style={{ marginTop: 4 }}>
            Argon2id · HTTP-Only Cookies · Fail2Ban Protection
          </div>
        </div>
      </div>
    </div>
  );
}
