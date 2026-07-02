'use client';

import React, { useState, useEffect } from 'react';

interface QueueTelemetry {
  success: boolean;
  currentSequenceNumber: number;
}

export default function UserOnboardingDashboard() {
  const [email, setEmail] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [selectedTier, setSelectedTier] = useState('FREE_STANDARD');
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [systemLog, setSystemLog] = useState('');

  useEffect(() => {
    async function fetchQueueState() {
      try {
        const response = await fetch('/api/onboarding/queue-status');
        const data: QueueTelemetry = await response.json();
        if (data.success) {
          setQueuePos(data.currentSequenceNumber);
        }
      } catch (err) {
        console.error('Telemetry pipeline sync failure:', err);
      }
    }

    fetchQueueState();
  }, []);

  const handleInitializeNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsDeploying(true);
    setSystemLog('INIT: Allocating memory blocks and virtual storage space...');

    try {
      const response = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          requestedDomain: customDomain || undefined,
          requestedTier: selectedTier,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSystemLog(
          `✔ SUCCESS: Tenant node cluster #${result.data?.manifest?.tenant_id ?? 'pending'} established. Check your inbox.`
        );
      } else {
        setSystemLog(
          `🚨 REJECTION: Onboarding gate rejected configuration. ${result.error}`
        );
      }
    } catch {
      setSystemLog('🚨 FAULT: Gateway response timeout. Check systemd daemon logs.');
    } finally {
      setIsDeploying(false);
    }
  };

  const isPromoEligible = queuePos !== null && queuePos < 1000;

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 font-mono flex items-center justify-center selection:bg-teal-500/30">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-6 space-y-6">
        {/* Header Segment */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-md font-bold tracking-wider text-white uppercase">
            🤖 VVU-BRAIN OS // Node Provisioning Engine
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">
            Deploy containerized workspace infrastructure, email structures, and
            custom networks.
          </p>
        </div>

        {/* Real-Time Promotion Queue Monitor */}
        {queuePos !== null && (
          <div
            className={`p-4 rounded-lg border text-xs leading-relaxed ${
              isPromoEligible
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <span className="font-bold">PROMOTIONAL BOUNDARY TELEMETRY:</span>
            <p className="mt-1 text-[11px]">
              {isPromoEligible
                ? `🔥 Current Queue Position: #${queuePos + 1}. You are eligible for the first-1,000 launch promotion. SafeLiner & SafeKrypte are permanently unlocked at R0.00.`
                : `🔒 Launch promotion limit reached (1,000/1,000 slots filled). Standard tiered subscription infrastructure models applied.`}
            </p>
          </div>
        )}

        {/* Input Fields Interactive Grid */}
        <form onSubmit={handleInitializeNode} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                Master Operator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@vvu-node.net"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                Custom Domain Mapping (Optional)
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="e.g., node-alpha.io"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {!isPromoEligible && queuePos !== null && (
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                Select Operating Core Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="FREE_STANDARD">
                  VVU Free Tier (Standard CLI Core Toolchain)
                </option>
                <option value="COMMERCIAL_PRO">
                  Commercial Core Pro (Edge Mesh Access)
                </option>
                <option value="INDUSTRY_MONOLITH">
                  Industry Architecture Tier (The One System)
                </option>
              </select>
            </div>
          )}

          {/* Real-time System Initialization Logs */}
          {systemLog && (
            <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg text-[11px] text-slate-300 font-mono break-all leading-normal">
              {systemLog}
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isDeploying}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold tracking-widest uppercase rounded-md transition-all text-xs"
            >
              {isDeploying
                ? 'PROVISIONING MULTI-TENANT FABRIC...'
                : 'INITIALIZE WORKSPACE HARDWARE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
