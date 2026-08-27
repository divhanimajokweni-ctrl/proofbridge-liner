'use client';

/**
 * Ubuntu Pool · Finance Room · VVU IVE
 * -------------------------------------
 * Community Stokvel (rotating savings group) for NMBM water-infrastructure
 * maintenance funding. 12 members each contribute R 20,000 / cycle into a pool
 * that pays out to one member each month in rotation. ProofBridge issues a
 * SHA-256-anchored receipt per contribution.
 *
 * Three panels:
 *   1. Pool Overview        — totals, cycle progress, next payout
 *   2. Contributors Table   — 12 rows, click a row to inspect its receipt
 *   3. ProofBridge Receipt  — read-only receipt + JSON download
 *   4. Payout Schedule      — 12-month vertical timeline, current cycle highlighted
 *
 * Self-contained — accepts no props. All amounts in ZAR (R prefix).
 */

import { useMemo, useState } from 'react';
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock4,
  Download,
  Hash,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ────────────────────────────────────────────────────────────

type ContributionStatus = 'PAID' | 'PENDING';

interface Member {
  /** Membership ID (join order). Padded to 2 chars. */
  id: string;
  name: string;
  /** Year-on-year per-cycle contribution. */
  contribution: number;
  status: ContributionStatus;
  /** Short display hash (e.g. "0x4f8e"). */
  shortHash: string;
  /** Full 64-char SHA-256-style receipt hash. */
  fullHash: string;
  /** ProofBridge receipt ID, e.g. PB-2026-08-001. */
  receiptId: string;
  /** ISO date the contribution was paid. */
  datePaid: string;
}

type PayoutStatus = 'PAID' | 'UPCOMING';

interface PayoutEntry {
  month: number;
  recipientId: string;
  recipientName: string;
  amount: number;
  status: PayoutStatus;
}

// ─── Mock data ────────────────────────────────────────────────────────

const POOL_NAME = 'NMBM Water Infrastructure Stokvel';
const TOTAL_POOL = 240_000; // R 240,000
const PER_MEMBER = 20_000; // R 20,000 per cycle
const MEMBER_COUNT = 12;
const CURRENT_CYCLE_MONTH = 7; // Month 7 of 12
const ANNUAL_CYCLE_LENGTH = 12;

const MEMBERS: Member[] = [
  { id: '01', name: 'Thandi N.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0x4f8e', fullHash: '0x4f8e9a3c7b2d1e8f5c6a9b0d3e2f1a4c7b8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f', receiptId: 'PB-2026-08-001', datePaid: '2026-08-02' },
  { id: '02', name: 'Jabulani K.', contribution: PER_MEMBER, status: 'PAID',    shortHash: '0xa2c1', fullHash: '0xa2c18b7d4e6f9102ac3bd5e8f1a4c7b9d0e2f3a6b8c1d4e7f9a2b5c8d1e4f7a0b', receiptId: 'PB-2026-08-002', datePaid: '2026-08-02' },
  { id: '03', name: 'Lerato M.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0x7b3d', fullHash: '0x7b3d4e6f8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', receiptId: 'PB-2026-08-003', datePaid: '2026-08-03' },
  { id: '04', name: 'Sipho M.',    contribution: PER_MEMBER, status: 'PENDING', shortHash: '0x9e5f', fullHash: '0x9e5f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', receiptId: 'PB-2026-08-004', datePaid: '2026-08-04' },
  { id: '05', name: 'Nomsa D.',    contribution: PER_MEMBER, status: 'PAID',    shortHash: '0xc1a8', fullHash: '0xc1a82b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c', receiptId: 'PB-2026-08-005', datePaid: '2026-08-04' },
  { id: '06', name: 'Bongani Z.',  contribution: PER_MEMBER, status: 'PAID',    shortHash: '0x3d7b', fullHash: '0x3d7b9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f', receiptId: 'PB-2026-08-006', datePaid: '2026-08-05' },
  { id: '07', name: 'Pieter V.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0xe2a4', fullHash: '0xe2a4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b', receiptId: 'PB-2026-08-007', datePaid: '2026-08-05' },
  { id: '08', name: 'Ayanda T.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0xb8c7', fullHash: '0xb8c7d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a', receiptId: 'PB-2026-08-008', datePaid: '2026-08-06' },
  { id: '09', name: 'Mandla S.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0x5d9e', fullHash: '0x5d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c', receiptId: 'PB-2026-08-009', datePaid: '2026-08-06' },
  { id: '10', name: 'Fatima K.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0xf3b2', fullHash: '0xf3b2a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', receiptId: 'PB-2026-08-010', datePaid: '2026-08-07' },
  { id: '11', name: 'Karabo R.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0xa0e6', fullHash: '0xa0e61b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d', receiptId: 'PB-2026-08-011', datePaid: '2026-08-07' },
  { id: '12', name: 'Zanele B.',   contribution: PER_MEMBER, status: 'PAID',    shortHash: '0x2c5d', fullHash: '0x2c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0', receiptId: 'PB-2026-08-012', datePaid: '2026-08-08' },
];

// Rotation order — different from membership ID order. The recipient at
// month 7 is Sipho M. (per task spec — "Next payout: Member #07 (Sipho M.)").
const PAYOUT_SCHEDULE: PayoutEntry[] = [
  { month: 1,  recipientId: '01', recipientName: 'Thandi N.',   amount: TOTAL_POOL / 12, status: 'PAID' },
  { month: 2,  recipientId: '02', recipientName: 'Jabulani K.', amount: TOTAL_POOL / 12, status: 'PAID' },
  { month: 3,  recipientId: '03', recipientName: 'Lerato M.',   amount: TOTAL_POOL / 12, status: 'PAID' },
  { month: 4,  recipientId: '05', recipientName: 'Nomsa D.',   amount: TOTAL_POOL / 12, status: 'PAID' },
  { month: 5,  recipientId: '06', recipientName: 'Bongani Z.', amount: TOTAL_POOL / 12, status: 'PAID' },
  { month: 6,  recipientId: '07', recipientName: 'Pieter V.',  amount: TOTAL_POOL / 12, status: 'PAID' },
  { month: 7,  recipientId: '04', recipientName: 'Sipho M.',   amount: TOTAL_POOL / 12, status: 'UPCOMING' },
  { month: 8,  recipientId: '08', recipientName: 'Ayanda T.',  amount: TOTAL_POOL / 12, status: 'UPCOMING' },
  { month: 9,  recipientId: '09', recipientName: 'Mandla S.',  amount: TOTAL_POOL / 12, status: 'UPCOMING' },
  { month: 10, recipientId: '10', recipientName: 'Fatima K.',  amount: TOTAL_POOL / 12, status: 'UPCOMING' },
  { month: 11, recipientId: '11', recipientName: 'Karabo R.',  amount: TOTAL_POOL / 12, status: 'UPCOMING' },
  { month: 12, recipientId: '12', recipientName: 'Zanele B.',  amount: TOTAL_POOL / 12, status: 'UPCOMING' },
];

// ─── Currency helper ──────────────────────────────────────────────────

function zar(amount: number): string {
  return 'R ' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ─── Component ─────────────────────────────────────────────────────────

export default function UbuntuPool() {
  const [selectedId, setSelectedId] = useState<string | null>('04'); // Sipho M. — PENDING

  const selected = useMemo(
    () => (selectedId ? MEMBERS.find((m) => m.id === selectedId) ?? null : null),
    [selectedId],
  );

  const paidCount = useMemo(
    () => MEMBERS.filter((m) => m.status === 'PAID').length,
    [],
  );

  // 58% of annual cycle (Month 7 of 12 → 7/12 ≈ 58%).
  const cycleProgress = Math.round(
    (CURRENT_CYCLE_MONTH / ANNUAL_CYCLE_LENGTH) * 100,
  );

  const nextPayout = PAYOUT_SCHEDULE.find(
    (p) => p.month === CURRENT_CYCLE_MONTH,
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--k-bg)] k-grid-bg">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[var(--k-line)] bg-[var(--k-panel)]">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Users className="h-4 w-4 k-cyan" />
          <h2 className="text-sm font-bold k-fg-bright uppercase tracking-wider">
            {POOL_NAME}
          </h2>
          <span className="k-badge k-badge-process">STOKVEL · 12 MEMBERS</span>
          <span className="k-badge k-badge-pass hidden sm:inline-flex">
            PROOFBRIDGE ANCHORED
          </span>
        </div>
        <p className="text-[11px] k-dim">
          Rotating community savings pool. Each cycle, 12 members contribute R 20,000
          and one member receives the R 240,000 pot. ProofBridge issues a SHA-256 receipt
          per contribution. <span className="k-cyan">Click a contributor row to inspect its receipt.</span>
        </p>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* ── Pool Overview ─────────────────────────────────────────── */}
          <section
            className="k-card k-glow-cyan"
            aria-label="Pool Overview"
          >
            <div className="k-card-title">
              <Wallet className="h-3.5 w-3.5" />
              Pool Overview
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total pool */}
              <div className="col-span-2 lg:col-span-1 flex flex-col justify-between rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-dim mb-1">
                  <Banknote className="h-3 w-3" />
                  Total Pool
                </div>
                <div
                  className="text-3xl sm:text-4xl font-bold k-pass leading-none"
                  style={{ textShadow: '0 0 16px rgba(0,255,136,0.4)' }}
                >
                  {zar(TOTAL_POOL)}
                </div>
                <div className="text-[10px] k-dim uppercase tracking-widest mt-2">
                  ZAR · cycle 2026/08
                </div>
              </div>

              {/* Contributors + Paid */}
              <div className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-dim mb-1">
                  <Users className="h-3 w-3" />
                  Contributors
                </div>
                <div className="text-2xl font-bold k-fg-bright">
                  {MEMBER_COUNT}
                  <span className="text-sm k-dim font-normal ml-1">members</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider">
                  <span className="k-pass">{paidCount} PAID</span>
                  <span className="k-dim">·</span>
                  <span className="k-warn">{MEMBER_COUNT - paidCount} PENDING</span>
                </div>
              </div>

              {/* Cycle */}
              <div className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-dim mb-1">
                  <CalendarClock className="h-3 w-3" />
                  Cycle Progress
                </div>
                <div className="text-2xl font-bold k-cyan">
                  Month {CURRENT_CYCLE_MONTH}
                  <span className="text-sm k-dim font-normal ml-1">/ {ANNUAL_CYCLE_LENGTH}</span>
                </div>
                <div className="mt-2">
                  <div className="k-trust-bar h-3">
                    <div
                      className="k-trust-bar-fill"
                      style={{ width: `${cycleProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase tracking-widest k-dim mt-1">
                    <span>{cycleProgress}% complete</span>
                    <span>{ANNUAL_CYCLE_LENGTH - CURRENT_CYCLE_MONTH} months left</span>
                  </div>
                </div>
              </div>

              {/* Next payout */}
              <div className="col-span-2 lg:col-span-1 rounded-md border border-[var(--k-amber-bright)]/40 bg-[rgba(255,184,0,0.04)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-warn mb-1">
                  <Clock4 className="h-3 w-3" />
                  Next Payout · Month {CURRENT_CYCLE_MONTH}
                </div>
                {nextPayout ? (
                  <>
                    <div className="text-xl font-bold k-fg-bright leading-tight">
                      Member #{nextPayout.recipientId} · {nextPayout.recipientName}
                    </div>
                    <div className="text-lg font-bold k-pass mt-1">
                      {zar(nextPayout.amount)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="k-badge k-badge-warn">UPCOMING</span>
                      <span className="text-[10px] k-dim uppercase tracking-widest">
                        rotates 2026-08-15
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm k-dim">—</div>
                )}
              </div>
            </div>
          </section>

          {/* ── Contributors + Receipt (2-col on lg) ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Contributors table */}
            <section
              className="k-card lg:col-span-3 flex flex-col"
              aria-label="Contributors"
            >
              <div className="k-card-title">
                <Users className="h-3.5 w-3.5" />
                Contributors · Current Cycle
              </div>
              <ScrollArea className="max-h-96 w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[var(--k-line)] hover:bg-transparent">
                      <TableHead className="w-10 text-[10px] uppercase tracking-widest k-dim">#</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest k-dim">Member</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-widest k-dim">Contribution</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest k-dim">Status</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest k-dim">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MEMBERS.map((m) => {
                      const isSel = m.id === selectedId;
                      return (
                        <TableRow
                          key={m.id}
                          data-state={isSel ? 'selected' : undefined}
                          onClick={() => setSelectedId(m.id)}
                          className="cursor-pointer border-[var(--k-line)] data-[state=selected]:bg-[rgba(0,212,255,0.06)]"
                        >
                          <TableCell className="font-mono text-xs k-dim">
                            {m.id}
                          </TableCell>
                          <TableCell className="font-bold text-sm k-fg-bright">
                            {m.name}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm k-cyan">
                            {zar(m.contribution)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`k-badge ${
                                m.status === 'PAID'
                                  ? 'k-badge-pass'
                                  : 'k-badge-warn'
                              }`}
                            >
                              {m.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] k-dim">
                            {m.shortHash}
                            <span className="opacity-50">…</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-3 pt-3 border-t border-[var(--k-line)] flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-widest k-dim">
                <span>
                  Total contributed ·{' '}
                  <span className="k-pass font-bold">
                    {zar(paidCount * PER_MEMBER)}
                  </span>
                </span>
                <span>
                  Awaiting ·{' '}
                  <span className="k-warn font-bold">
                    {zar((MEMBER_COUNT - paidCount) * PER_MEMBER)}
                  </span>
                </span>
              </div>
            </section>

            {/* ProofBridge Receipt */}
            <section
              className="k-card lg:col-span-2 flex flex-col"
              aria-label="ProofBridge Receipt"
            >
              <div className="k-card-title">
                <Receipt className="h-3.5 w-3.5" />
                ProofBridge Receipt
              </div>
              {selected ? (
                <ReceiptPanel member={selected} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-xs k-dim py-12">
                  <div>
                    <CircleDashed className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Select a contributor to inspect its receipt.
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Payout Schedule ──────────────────────────────────────── */}
          <section className="k-card" aria-label="Payout Schedule">
            <div className="k-card-title">
              <CalendarClock className="h-3.5 w-3.5" />
              Payout Schedule · 12-Month Rotation
            </div>
            <PayoutTimeline />
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt panel ────────────────────────────────────────────────────

function ReceiptRow({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[10px] uppercase tracking-widest k-dim shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-right text-xs ${mono ? 'font-mono' : ''} ${
          color ?? 'k-fg-bright'
        } break-all`}
      >
        {value}
      </span>
    </div>
  );
}

function ReceiptPanel({ member }: { member: Member }) {
  const handleDownload = () => {
    const receipt = {
      receiptId: member.receiptId,
      issuer: 'ProofBridge v1.0',
      pool: POOL_NAME,
      member: {
        id: member.id,
        name: member.name,
      },
      amountZar: member.contribution,
      currency: 'ZAR',
      datePaid: member.datePaid,
      status: member.status,
      receiptHash: member.fullHash,
      hashAlgorithm: 'SHA-256',
      schema: 'proofbridge.receipt/v1',
      classification: 'SIMULATION — NOT A FINANCIAL INSTRUMENT',
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member.receiptId}-${member.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Receipt head */}
      <div className="rounded-md border border-[var(--k-cyan-bright)]/40 bg-[rgba(0,212,255,0.04)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="k-badge k-badge-process">{member.receiptId}</span>
          <span
            className={`k-badge ${
              member.status === 'PAID' ? 'k-badge-pass' : 'k-badge-warn'
            }`}
          >
            {member.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-dim mb-1">
          <Hash className="h-3 w-3" />
          Receipt Hash · SHA-256
        </div>
        <code className="block font-mono text-[10px] k-cyan break-all leading-relaxed">
          {member.fullHash}
        </code>
      </div>

      {/* Receipt body */}
      <div className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] p-3">
        <ReceiptRow label="Member" value={`${member.name} · #${member.id}`} />
        <Separator className="bg-[var(--k-line)] my-1" />
        <ReceiptRow
          label="Amount"
          value={zar(member.contribution)}
          mono
          color="var(--k-green-bright)"
        />
        <Separator className="bg-[var(--k-line)] my-1" />
        <ReceiptRow label="Currency" value="ZAR (South African Rand)" mono />
        <Separator className="bg-[var(--k-line)] my-1" />
        <ReceiptRow label="Date Paid" value={member.datePaid} mono />
        <Separator className="bg-[var(--k-line)] my-1" />
        <ReceiptRow label="Pool" value={POOL_NAME} />
        <Separator className="bg-[var(--k-line)] my-1" />
        <ReceiptRow label="Issuer" value="ProofBridge v1.0" mono />
      </div>

      {/* Download */}
      <Button
        onClick={handleDownload}
        className="w-full border border-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.06)] text-[var(--k-cyan-bright)] hover:bg-[rgba(0,212,255,0.12)] hover:text-[var(--k-cyan-bright)]"
        variant="outline"
      >
        <Download className="h-4 w-4" />
        Download Receipt · JSON
      </Button>

      <p className="text-[9px] k-dim uppercase tracking-widest text-center">
        SIMULATION · NOT A FINANCIAL INSTRUMENT · NOT MUNICIPAL OPERATIONAL DATA
      </p>
    </div>
  );
}

// ─── Payout timeline ──────────────────────────────────────────────────

function PayoutTimeline() {
  return (
    <div className="relative">
      {/* Vertical trunk line */}
      <div
        aria-hidden
        className="absolute left-[19px] sm:left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--k-green-bright)]/50 via-[var(--k-amber-bright)]/40 to-[var(--k-dim)]/30"
      />
      <ol className="flex flex-col gap-1.5">
        {PAYOUT_SCHEDULE.map((entry) => {
          const isCurrent = entry.month === CURRENT_CYCLE_MONTH;
          const isPast = entry.month < CURRENT_CYCLE_MONTH;
          return (
            <li
              key={entry.month}
              className="relative pl-10 sm:pl-14"
            >
              {/* Month badge on trunk */}
              <span
                aria-hidden
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 sm:w-12"
              >
                <span
                  className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 bg-[var(--k-bg-elevated)] font-mono font-bold text-xs"
                  style={{
                    color: isCurrent
                      ? 'var(--k-amber-bright)'
                      : isPast
                        ? 'var(--k-green-bright)'
                        : 'var(--k-dim)',
                    borderColor: isCurrent
                      ? 'var(--k-amber-bright)'
                      : isPast
                        ? 'var(--k-green-bright)'
                        : 'var(--k-line-strong)',
                    boxShadow: isCurrent
                      ? '0 0 12px rgba(255,184,0,0.35)'
                      : isPast
                        ? '0 0 8px rgba(0,255,136,0.25)'
                        : 'none',
                  }}
                >
                  M{String(entry.month).padStart(2, '0')}
                </span>
              </span>

              {/* Card */}
              <div
                className="rounded-md border bg-[var(--k-panel)] px-3 py-2 flex items-center justify-between gap-3 transition-colors"
                style={{
                  borderColor: isCurrent
                    ? 'var(--k-amber-bright)'
                    : 'var(--k-line-strong)',
                  boxShadow: isCurrent
                    ? '0 0 0 1px var(--k-amber-bright), 0 0 16px rgba(255,184,0,0.15)'
                    : 'none',
                  backgroundColor: isCurrent
                    ? 'rgba(255,184,0,0.04)'
                    : 'var(--k-panel)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {entry.status === 'PAID' ? (
                    <CheckCircle2 className="h-4 w-4 k-pass shrink-0" />
                  ) : (
                    <Clock4
                      className={`h-4 w-4 shrink-0 ${
                        isCurrent ? 'k-warn' : 'k-dim'
                      }`}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-bold k-fg-bright truncate">
                      {entry.recipientName}
                      <span className="ml-2 text-[10px] font-mono k-dim">
                        #{entry.recipientId}
                      </span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest k-dim">
                      Month {entry.month} · 2026
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm font-mono font-bold ${
                      isPast ? 'k-pass' : isCurrent ? 'k-warn' : 'k-dim'
                    }`}
                  >
                    {zar(entry.amount)}
                  </span>
                  <span
                    className={`k-badge ${
                      entry.status === 'PAID'
                        ? 'k-badge-pass'
                        : isCurrent
                          ? 'k-badge-warn'
                          : 'k-badge-dim'
                    }`}
                  >
                    {isCurrent ? 'CURRENT' : entry.status}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
