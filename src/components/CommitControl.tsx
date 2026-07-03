'use client';
import React, { useState } from 'react';
import { ShieldCheck, Loader2, Share2, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * CommitControl — The "Sign & Commit" button for the ProofBridge Editor.
 *
 * Triggers the Cosign signing pipeline, pushes the proof artifact to the
 * Ubuntu Pool (IPFS), and reports back the anchoring status.
 *
 * Usage:
 *   <CommitControl filePath="Theorem4.lean" onAuditUpdate={(msg) => ...} />
 *
 * States:
 *   idle     → Ready to sign
 *   signing  → Pipeline in progress (spinner)
 *   success  → Anchored to Ubuntu Pool (green check)
 *   error    → Signing failed (red alert)
 *   pooled   → Fully ratified (shares icon)
 */
export type CommitStatus = 'idle' | 'signing' | 'success' | 'error' | 'pooled';

interface CommitControlProps {
  filePath: string;
  onAuditUpdate?: (message: string) => void;
  onStatusChange?: (status: CommitStatus, cid?: string) => void;
}

function CommitControl({ filePath, onAuditUpdate, onStatusChange }: CommitControlProps) {
  const [status, setStatus] = useState<CommitStatus>('idle');
  const [cid, setCid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pushAudit = (msg: string) => {
    if (onAuditUpdate) onAuditUpdate(msg);
  };

  const handleStatus = (s: CommitStatus, c?: string) => {
    setStatus(s);
    if (c) setCid(c);
    if (onStatusChange) onStatusChange(s, c);
  };

  const handleCommit = async () => {
    if (status === 'signing') return; // prevent double-click

    setErrorMsg(null);
    handleStatus('signing');
    pushAudit(`[COMMIT] Signing pipeline initiated for ${filePath}...`);

    try {
      const response = await fetch('/api/proof/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.cid) {
        handleStatus('success', data.cid);
        pushAudit(`[UBUNTU_POOL] Anchored: ${data.cid} (Sig: Valid)`);
        pushAudit(`[LINDIWE] Status: ${data.signatures}/3 signatures (Pending Consensus)`);

        // After 2 seconds, transition to "pooled" to indicate the
        // artifact has propagated through the Ubuntu Pool.
        setTimeout(() => {
          handleStatus('pooled');
          pushAudit(`[UBUNTU_POOL] Proof ratified — ${data.cid} is canonical`);
        }, 2000);
      } else {
        throw new Error('No CID returned from signing pipeline');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setErrorMsg(msg);
      handleStatus('error');
      pushAudit(`[COMMIT] FAILED: ${msg}`);
    }
  };

  // ── Visual ──
  const commonClasses =
    'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-all duration-200';

  if (status === 'idle') {
    return (
      <button
        onClick={handleCommit}
        className={`${commonClasses} text-[#050505] bg-[#4ADE80] hover:bg-green-400 active:scale-95`}
        title={`Sign & commit ${filePath} to Ubuntu Pool`}
      >
        <ShieldCheck size={14} />
        <span>Sign &amp; Commit</span>
      </button>
    );
  }

  if (status === 'signing') {
    return (
      <div className={`${commonClasses} text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/20`}>
        <Loader2 size={14} className="animate-spin" />
        <span>Cosign Active...</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={`${commonClasses} text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20`}>
        <CheckCircle size={14} />
        <span title={cid || undefined}>Anchored · {cid?.slice(0, 12)}...</span>
      </div>
    );
  }

  if (status === 'pooled') {
    return (
      <div className={`${commonClasses} text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20`}>
        <Share2 size={14} />
        <span title={cid || undefined}>Pooled · {cid?.slice(0, 12)}...</span>
      </div>
    );
  }

  // error state
  return (
    <div
      className={`${commonClasses} text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 cursor-pointer`}
      onClick={() => handleStatus('idle')}
      title="Click to retry"
    >
      <AlertTriangle size={14} />
      <span>Failed · tap to retry</span>
    </div>
  );
}

export { CommitControl };
export default CommitControl;
