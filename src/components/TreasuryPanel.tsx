'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Zap,
  RefreshCw,
  Trophy,
  Coins,
  PiggyBank,
  Split,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

interface TreasuryPanelProps {
  className?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const EARNINGS_DATA = [
  { day: 'Mon', value: 4200 },
  { day: 'Tue', value: 4350 },
  { day: 'Wed', value: 4100 },
  { day: 'Thu', value: 4800 },
  { day: 'Fri', value: 5200 },
  { day: 'Sat', value: 5900 },
  { day: 'Sun', value: 6450 },
];

const TRANSACTIONS = [
  {
    id: 1,
    source: 'Siege Win: Riemann Zeta',
    type: 'BOUNTY',
    amount: '+$500.00',
    currency: 'USD',
    time: '2m ago',
    icon: Shield,
    color: 'var(--consensus)',
  },
  {
    id: 2,
    source: 'Twitch Donation (x4)',
    type: 'STREAM',
    amount: '+$24.50',
    currency: 'USD',
    time: '1h ago',
    icon: Zap,
    color: '#A855F7',
  },
  {
    id: 3,
    source: 'AWS Compute Rent',
    type: 'EXPENSE',
    amount: '-$12.00',
    currency: 'USD',
    time: '4h ago',
    icon: ArrowUpRight,
    color: 'var(--breach)',
  },
  {
    id: 4,
    source: 'Lindiwe Yield (Staking)',
    type: 'PASSIVE',
    amount: '+$4.20',
    currency: 'USD',
    time: '6h ago',
    icon: RefreshCw,
    color: 'var(--verify)',
  },
  {
    id: 5,
    source: 'Golf Speedrun: QuickSort',
    type: 'BOUNTY',
    amount: '+200 REP',
    currency: 'REP',
    time: '12h ago',
    icon: Trophy,
    color: 'var(--consensus)',
  },
  {
    id: 6,
    source: 'Guild Dues (Topology Squad)',
    type: 'EXPENSE',
    amount: '-50 REP',
    currency: 'REP',
    time: '1d ago',
    icon: UsersIcon,
    color: 'var(--breach)',
  },
];

// ── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  active = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
        background: active ? 'rgba(16,185,129,0.06)' : 'var(--substrate)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <Icon size={14} style={{ color: active ? 'var(--verify)' : 'var(--muted)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, marginTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.02em' }}>
          {value}
        </div>
        <div style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, color: active ? 'var(--verify)' : 'var(--muted)' }}>
          {sub.includes('+') && <TrendingUp size={10} />}
          {sub}
        </div>
      </div>
      {/* Background glow */}
      {active && (
        <div
          style={{
            position: 'absolute',
            right: -16,
            bottom: -16,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.08)',
            filter: 'blur(24px)',
          }}
        />
      )}
    </div>
  );
}

function UsersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TreasuryPanel({ className = '' }: TreasuryPanelProps) {
  const [timeRange, setTimeRange] = useState('1W');

  return (
    <div
      className={`treasury-panel ${className}`}
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--void)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'IBM Plex Mono', monospace",
        position: 'relative',
      }}
    >
      {/* ═══════════ 1. HEADER: Total Net Worth ═══════════ */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(15,15,17,0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--verify)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <Wallet size={12} />
            Treasury // Sovereign Vault
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: "'Syne', system-ui, sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              $6,450.00
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'var(--verify)',
                fontFamily: "'IBM Plex Mono', monospace",
                background: 'rgba(16,185,129,0.1)',
                padding: '1px 6px',
                borderRadius: 4,
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              +12.4%
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{
              padding: '6px 12px',
              background: 'var(--substrate)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--substrate)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            Manage
          </button>
          <button
            style={{
              padding: '6px 12px',
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 6,
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--verify)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
          >
            <ArrowDownLeft size={10} />
            Cash Out
          </button>
        </div>
      </div>

      {/* ═══════════ 2. DASHBOARD BODY ═══════════ */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 14,
        }}
      >
        {/* ── LEFT COL: Stats ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StatCard label="Fiat Balance" value="$4,200.00" sub="+$150 today" icon={DollarSign} active />
          <StatCard label="Lindiwe Rep" value="15,400 REP" sub="≈ $1,540.00 USD" icon={Shield} />
          <StatCard label="Crypto (ETH)" value="0.24 ETH" sub="≈ $710.00 USD" icon={CreditCard} />

          {/* Smart Split Visualizer */}
          <div
            style={{
              marginTop: 'auto',
              padding: 14,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--substrate)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Split size={10} style={{ display: 'inline', marginRight: 4 }} />
                Smart Split Rule
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: 'var(--verify)',
                  background: 'rgba(16,185,129,0.1)',
                  padding: '1px 5px',
                  borderRadius: 3,
                }}
              >
                ACTIVE
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
                marginBottom: 8,
                display: 'flex',
              }}
            >
              <div style={{ width: '50%', height: '100%', background: 'var(--verify)' }} />
              <div style={{ width: '30%', height: '100%', background: '#3B82F6' }} />
              <div style={{ width: '20%', height: '100%', background: '#A855F7' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--verify)', display: 'inline-block' }} />
                RENT (50%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
                SAVINGS (30%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#A855F7', display: 'inline-block' }} />
                GUILD (20%)
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COL: Chart & History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Main Chart */}
          <div
            style={{
              height: 200,
              background: 'var(--substrate)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Income Velocity
              </span>
              <div
                style={{
                  display: 'flex',
                  gap: 2,
                  background: 'var(--void)',
                  borderRadius: 6,
                  padding: 2,
                  border: '1px solid var(--border)',
                }}
              >
                {['1D', '1W', '1M', '1Y'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    style={{
                      padding: '2px 8px',
                      fontSize: 8,
                      fontWeight: 700,
                      borderRadius: 4,
                      border: 'none',
                      background: timeRange === range ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: timeRange === range ? 'var(--verify)' : 'var(--muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EARNINGS_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="treasuryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      background: '#0F0F11',
                      border: '1px solid #2E2E32',
                      borderRadius: 6,
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                    itemStyle={{ color: '#10B981' }}
                    labelStyle={{ color: '#6A8099' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E2E32" strokeWidth={0.5} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6A8099', fontSize: 9, fontFamily: "'IBM Plex Mono', monospace" }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6A8099', fontSize: 9, fontFamily: "'IBM Plex Mono', monospace" }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#treasuryGradient)"
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Ledger Events */}
          <div
            style={{
              flex: 1,
              background: 'var(--substrate)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(15,15,17,0.5)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Recent Ledger Events
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: 'var(--verify)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                VIEW ALL
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
              <AnimatePresence>
                {TRANSACTIONS.map(tx => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderBottom: '1px solid rgba(46,46,50,0.4)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      borderRadius: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: `${tx.color}15`,
                          border: `1px solid ${tx.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <tx.icon size={12} style={{ color: tx.color }} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: '#D1D5DB',
                            fontWeight: 600,
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          {tx.source}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 8,
                            color: 'var(--muted)',
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          <span>{tx.time}</span>
                          <span>·</span>
                          <span>{tx.type}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: tx.amount.startsWith('+') ? 'var(--verify)' : 'var(--breach)',
                        flexShrink: 0,
                      }}
                    >
                      {tx.amount}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ 3. FOOTER ═══════════ */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '4px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 8,
          color: 'var(--muted)',
          fontFamily: "'IBM Plex Mono', monospace",
          flexShrink: 0,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <span>
          Last sync:{' '}
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ color: 'var(--verify)' }}>
          <Shield size={8} style={{ display: 'inline', marginRight: 2 }} />
          SOVEREIGN VAULT
        </span>
      </div>
    </div>
  );
}
