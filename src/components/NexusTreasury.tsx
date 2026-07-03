'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  DollarSign,
  Zap,
  Coins,
  CreditCard,
  History,
  RefreshCw,
} from 'lucide-react';
import nexus, { type TreasuryBalance, type Transaction } from '../engine/NexusIntegrator';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_BALANCE: TreasuryBalance = {
  fiat: { usd: 4520.50, eur: 320.00 },
  crypto: { usdc: 1250.00, eth: 0.42 },
  lindiwe: { repScore: 14800, repValueUsd: 592.00 },
  totalUsd: 6682.50,
  updatedAt: new Date().toISOString(),
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'EARNED', amount: 500, currency: 'REP', description: 'Siege victory: Auth.lean breached', source: 'Arena', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'confirmed' },
  { id: 'tx2', type: 'DONATION', amount: 25, currency: 'USD', description: 'Stream tip from @MathFan42', source: 'Twitch', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'confirmed' },
  { id: 'tx3', type: 'STAKE', amount: 100, currency: 'REP', description: 'Staked on Lemma_Topology bounty', source: 'Arena', timestamp: new Date(Date.now() - 14400000).toISOString(), status: 'pending' },
  { id: 'tx4', type: 'BOUNTY', amount: 200, currency: 'REP', description: 'Proof Golf: QuickSort Correctness', source: 'UbuntuGames', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'confirmed' },
  { id: 'tx5', type: 'EARNED', amount: 0.05, currency: 'ETH', description: 'Pool node reward: Q2 distribution', source: 'Ubuntu Pool', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'confirmed' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface NexusTreasuryProps {
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NexusTreasury({ className = '' }: NexusTreasuryProps) {
  const [balance, setBalance] = useState<TreasuryBalance>(MOCK_BALANCE);
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // On mount, try to load from Nexus vault
  useEffect(() => {
    nexus.getTreasuryBalance().then(saved => {
      if (saved.totalUsd > 0) setBalance(saved);
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  };

  // ── Currency segment ──
  const Segment = ({
    label,
    amount,
    currency,
    color,
    icon,
  }: {
    label: string;
    amount: number;
    currency: string;
    color: string;
    icon: React.ReactNode;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid rgba(46,46,50,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
          <div style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 600 }}>
            {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span style={{ fontSize: 9, color: '#6A8099', marginLeft: 4 }}>{currency}</span>
          </div>
        </div>
      </div>
      {currency === 'USD' && (
        <span style={{ fontSize: 9, color: '#10B981', display: 'flex', alignItems: 'center', gap: 2 }}>
          <ArrowUpRight size={8} />
          +2.4%
        </span>
      )}
    </div>
  );

  // ── Transaction row ──
  const TxRow = ({ tx }: { tx: Transaction }) => {
    const isPositive = tx.type === 'EARNED' || tx.type === 'DONATION' || tx.type === 'BOUNTY';
    const colors: Record<string, string> = {
      EARNED: '#10B981', SPENT: '#EF4444', DONATION: '#3B82F6',
      BOUNTY: '#F59E0B', STAKE: '#A855F7',
    };
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          borderBottom: '1px solid rgba(46,46,50,0.3)',
          fontSize: 10,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors[tx.type] ?? '#6A8099',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#D1D5DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tx.description}
          </div>
          <div style={{ fontSize: 8, color: '#6A8099' }}>
            {tx.source} · {new Date(tx.timestamp).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: isPositive ? '#10B981' : '#EF4444', fontWeight: 700 }}>
            {isPositive ? '+' : '-'}{tx.amount}
            <span style={{ fontSize: 8, color: '#6A8099', marginLeft: 2 }}>{tx.currency}</span>
          </div>
          <div
            style={{
              fontSize: 7,
              color: tx.status === 'confirmed' ? '#10B981' : '#FBBF24',
            }}
          >
            {tx.status}
          </div>
        </div>
      </div>
    );
  };

  const repToUsd = (balance.lindiwe.repScore ?? 0) * 0.04; // 1 REP = $0.04

  return (
    <div
      className={`nexus-treasury ${className}`}
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--substrate, #0F0F11)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border, #2E2E32)',
          background: 'rgba(15,15,17,0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wallet size={12} style={{ color: '#10B981' }} />
          <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Treasury
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: 'none', border: '1px solid #2E2E32',
              borderRadius: 6, padding: '2px 8px',
              color: showHistory ? '#10B981' : '#6A8099',
              cursor: 'pointer', fontSize: 9,
            }}
          >
            <History size={10} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            style={{
              background: 'none', border: '1px solid #2E2E32',
              borderRadius: 6, padding: '2px 8px',
              color: '#6A8099', cursor: 'pointer', fontSize: 9,
            }}
          >
            <RefreshCw size={10} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </motion.button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {/* Total Net Worth */}
        <div
          style={{
            textAlign: 'center',
            padding: '12px 0',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 9, color: '#6A8099', marginBottom: 2 }}>NET WORTH</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: "'Syne', system-ui, sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            ${balance.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 9, color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <TrendingUp size={10} />
            +$124.50 today
          </div>
        </div>

        {showHistory ? (
          /* ── Transaction History ── */
          <div>
            <div style={{ fontSize: 9, color: '#6A8099', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recent Activity
            </div>
            <AnimatePresence>
              {transactions.map(tx => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TxRow tx={tx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* ── Balance Breakdown ── */
          <div>
            <Segment label="Lindiwe Reputation" amount={balance.lindiwe.repScore} currency="REP" color="#F59E0B" icon={<Trophy size={14} />} />
            <Segment label="REP → USD Value" amount={repToUsd} currency="USD" color="#F59E0B" icon={<DollarSign size={14} />} />
            <Segment label="Fiat (USD)" amount={balance.fiat.usd} currency="USD" color="#10B981" icon={<CreditCard size={14} />} />
            <Segment label="Fiat (EUR)" amount={balance.fiat.eur} currency="EUR" color="#3B82F6" icon={<CreditCard size={14} />} />
            <Segment label="USDC" amount={balance.crypto.usdc} currency="USDC" color="#818CF8" icon={<Coins size={14} />} />
            <Segment label="ETH" amount={balance.crypto.eth} currency="ETH" color="#A78BFA" icon={<Zap size={14} />} />

            {/* Quick Actions */}
            <div
              style={{
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(16,185,129,0.2)',
                background: 'rgba(16,185,129,0.05)',
              }}
            >
              <div style={{ fontSize: 9, color: '#10B981', marginBottom: 4, fontWeight: 600 }}>
                <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                Privacy Guarantee
              </div>
              <div style={{ fontSize: 8, color: '#6A8099', lineHeight: 1.4 }}>
                All financial data stored locally in your Nexus Vault. Never uploaded to cloud servers.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: '1px solid var(--border, #2E2E32)',
          padding: '4px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 8,
          color: '#6A8099',
          flexShrink: 0,
        }}
      >
        <span>Last sync: {new Date(balance.updatedAt).toLocaleTimeString()}</span>
        <span style={{ color: '#10B981' }}>● SOVEREIGN</span>
      </div>
    </div>
  );
}

// Local alias for Trophy (lucide doesn't export it by that name)
function Trophy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
