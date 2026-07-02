'use client';

import React, { useState, useEffect } from 'react';

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
  const [selectedGroup, setSelectedGroup] = useState<PolicyGroupRule | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>(
    'IDLE'
  );

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
          prev.map((p) =>
            p.groupId === selectedGroup.groupId ? selectedGroup : p
          )
        );
      }
    } catch (err) {
      setSaveStatus('IDLE');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200 font-mono text-xs tracking-widest animate-pulse">
        SYNCHRONIZING OPA REGULATION MATRIX...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 font-mono selection:bg-teal-500/30">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Block */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">
              🛡️ Token Authorization & RBAC Management Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure declarative Rego policy parameters for distributed
              community clusters.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400">
            OPA Sidecar API:{' '}
            <span className="text-emerald-400 font-bold">ONLINE (:8181)</span>
          </div>
        </header>

        {/* Dashboard Workstation Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel Column: List of Community Groups */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase px-1">
              Active Community Groups
            </h3>
            <div className="space-y-2">
              {policies.map((group) => (
                <button
                  key={group.groupId}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSaveStatus('IDLE');
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                    selectedGroup?.groupId === group.groupId
                      ? 'bg-slate-900 border-teal-500/50 shadow-md shadow-teal-950/10'
                                              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      {group.groupName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ID: {group.groupId}
                    </p>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      group.isEnforced ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </button>
                              ))}
            </div>
          </div>

          {/* Right Panel Column: Interactive Rule Modifier Form */}
          {selectedGroup && (
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
                <h3 className="text-sm font-bold text-teal-400 uppercase">
                  [ EDITING POLICIES // {selectedGroup.groupName} ]
                </h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <span className="text-slate-400">ENFORCE STRAT:</span>
                  <input
                    type="checkbox"
                    checked={selectedGroup.isEnforced}
                    onChange={(e) =>
                      setSelectedGroup({
                        ...selectedGroup,
                        isEnforced: e.target.checked,
                      })
                    }
                    className="accent-teal-500 rounded border-slate-800 focus:ring-0"
                  />
                </label>
              </div>

              <form onSubmit={handleRuleMutationSubmit} className="space-y-5 text-xs">
                {/* Parameter Input Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                      Max Burst Sessions Rate Limit
                    </label>
                    <input
                      type="number"
                      value={selectedGroup.rateLimitPerMinute}
                      onChange={(e) =>
                        setSelectedGroup({
                          ...selectedGroup,
                          rateLimitPerMinute: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                      Max Multi-Thread Concurrent Sessions
                    </label>
                    <input
                      type="number"
                      value={selectedGroup.maxConcurrentSessions}
                      onChange={(e) =>
                        setSelectedGroup({
                          ...selectedGroup,
                          maxConcurrentSessions: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Array Attribute Mapping Fields */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                    Permitted Protocol Call Intents
                  </label>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-2">
                    {['CRYPT_SEAL', 'LOG_ROUTE', 'CONTAINER_SPAWN', 'AUDIO_COMPILE', 'RENDER_EXEC'].map((intent) => {
                      const isChecked = selectedGroup.allowedMethods.includes(intent);
                      return (
                        <label key={intent} className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newMethods = isChecked
                                ? selectedGroup.allowedMethods.filter((m) => m !== intent)
                                : [...selectedGroup.allowedMethods, intent];
                              setSelectedGroup({
                                ...selectedGroup,
                                allowedMethods: newMethods,
                              });
                            }}
                            className="accent-teal-500 rounded border-slate-800 bg-slate-900"
                          />
                          <span className="font-mono text-xs">{intent}</span>
                        </label>
                      );
                    })}
</div>
</div>

                {/* Form Actions Footer Area */}
                <div className="flex justify-end items-center gap-4 pt-2">
                  {saveStatus === 'SUCCESS' && (
                    <span className="text-emerald-400 font-bold animate-fade-in text-[11px]">
                      ✔ OPA MANIFEST HOT-RELOADED LIVE
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saveStatus === 'SAVING'}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold tracking-widest uppercase rounded-md transition-all shadow-md shadow-teal-950/20"
                  >
                    {saveStatus === 'SAVING'
                      ? 'PUSHING RUNTIME RULES...'
                      : 'APPLY CHANGE RULESETS'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
