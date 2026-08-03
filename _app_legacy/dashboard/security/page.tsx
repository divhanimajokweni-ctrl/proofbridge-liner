'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/variables.css';
import '../../styles/dashboard-shell.css';
import { PageGuide } from '../../components/PageGuide';

type PolicyGroupRule = {
  groupId: string;
  groupName: 'UBUNTU_DJ' | 'UBUNTU_GAMES' | 'SAFESPACE_IDE' | 'SAFEDECK_CORP';
  maxConcurrentSessions: number;
  rateLimitPerMinute: number;
  allowedMethods: string[];
  isEnforced: boolean;
};

export default function TokenAuthorizationConsole() {
  const [policies, setPolicies] = useState<PolicyGroupRule[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PolicyGroupRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

  useEffect(() => {
    async function loadActivePolicies() {
      try {
        const response = await fetch('/api/security/policies-fetch');
        const data = await response.json();
        if (data.success) {
          setPolicies(data.rules);
          setSelectedGroup(data.rules[0] || null);
        }
      } catch (err) {
        console.error('Failed to sync structural policy rules:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadActivePolicies();
  }, []);

  const handleRuleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setSaveStatus('SAVING');
    try {
      const response = await fetch('/api/security/policies-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutatedRule: selectedGroup }),
      });
      if (response.ok) {
        setSaveStatus('SUCCESS');
        setTimeout(() => setSaveStatus('IDLE'), 3000);
        setPolicies((prev) =>
          prev.map((p) => (p.groupId === selectedGroup.groupId ? selectedGroup : p))
        );
      }
    } catch (err) {
      setSaveStatus('IDLE');
    }
  };

  if (isLoading) {
    return (
      <div className="vvu-shell" style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
        color: 'var(--color-text-secondary)',
      }}>
        SYNCHRONIZING OPA REGULATION MATRIX…
      </div>
    );
  }

  return (
    <div className="vvu-page">
      <div className="vvu-page-header">
        <div>
          <h1 className="vvu-page-title">TOKEN AUTHORIZATION &amp; RBAC</h1>
          <p className="vvu-page-subtitle">Declarative Rego policy parameters · Distributed community clusters</p>
        </div>
        <span className="vvu-badge vvu-badge--active">OPA SIDECAR :8181 ONLINE</span>
      </div>

      <PageGuide index={1} title="Select a group, edit its policy, apply">
        Pick a community group on the left. Its current rate limits, session caps,
        and allowed protocol intents load on the right — change what's needed and
        press Apply to hot-reload the OPA manifest live.
      </PageGuide>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="vvu-eyebrow">Active Community Groups</span>
          {policies.map((group) => {
            const active = selectedGroup?.groupId === group.groupId;
            return (
              <button
                key={group.groupId}
                onClick={() => { setSelectedGroup(group); setSaveStatus('IDLE'); }}
                className="vvu-card"
                style={{
                  cursor: 'pointer',
                  textAlign: 'left',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderColor: active ? 'var(--color-gold-border)' : 'var(--color-border)',
                  boxShadow: active ? 'var(--color-glow-gold)' : 'none',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: 'var(--color-text-primary)' }}>
                    {group.groupName}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                    ID: {group.groupId}
                  </span>
                </div>
                <span
                  className={`vvu-badge ${group.isEnforced ? 'vvu-badge--active' : 'vvu-badge--pilot'}`}
                  style={{ padding: '2px 6px' }}
                >
                  {group.isEnforced ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>

        {selectedGroup && (
          <div className="vvu-card" style={{ gap: 20 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--color-border)', paddingBottom: 12,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--color-gold-bright)', letterSpacing: '0.04em' }}>
                EDITING POLICIES // {selectedGroup.groupName}
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                ENFORCE
                <input
                  type="checkbox"
                  checked={selectedGroup.isEnforced}
                  onChange={(e) => setSelectedGroup({ ...selectedGroup, isEnforced: e.target.checked })}
                />
              </label>
            </div>

            <form onSubmit={handleRuleMutationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label className="vvu-field-label">Max Burst Rate / Min</label>
                  <input
                    type="number"
                    value={selectedGroup.rateLimitPerMinute}
                    onChange={(e) => setSelectedGroup({ ...selectedGroup, rateLimitPerMinute: parseInt(e.target.value) || 0 })}
                    className="vvu-input"
                  />
                </div>
                <div>
                  <label className="vvu-field-label">Max Concurrent Sessions</label>
                  <input
                    type="number"
                    value={selectedGroup.maxConcurrentSessions}
                    onChange={(e) => setSelectedGroup({ ...selectedGroup, maxConcurrentSessions: parseInt(e.target.value) || 0 })}
                    className="vvu-input"
                  />
                </div>
              </div>

              <div>
                <label className="vvu-field-label">Permitted Protocol Call Intents</label>
                <div className="vvu-card" style={{ gap: 8 }}>
                  {['CRYPT_SEAL', 'LOG_ROUTE', 'CONTAINER_SPAWN', 'AUDIO_COMPILE', 'RENDER_EXEC'].map((intent) => {
                    const isChecked = selectedGroup.allowedMethods.includes(intent);
                    return (
                      <label key={intent} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newMethods = isChecked
                              ? selectedGroup.allowedMethods.filter((m) => m !== intent)
                              : [...selectedGroup.allowedMethods, intent];
                            setSelectedGroup({ ...selectedGroup, allowedMethods: newMethods });
                          }}
                        />
                        {intent}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
                {saveStatus === 'SUCCESS' && (
                  <span className="vvu-alert-success" style={{ border: 'none', background: 'none', padding: 0 }}>
                    ✔ OPA MANIFEST HOT-RELOADED LIVE
                  </span>
                )}
                <button type="submit" disabled={saveStatus === 'SAVING'} className="vvu-btn-primary">
                  {saveStatus === 'SAVING' ? 'PUSHING RUNTIME RULES…' : 'APPLY CHANGE RULESETS'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
