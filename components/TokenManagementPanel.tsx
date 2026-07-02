'use client';

import React, { useState } from 'react';

interface ApiKeyMetadata {
  keyId: string;
  label: string;
  assignedAgent: string;
  secretPrefix: string;
  createdAt: string;
}

export default function TokenManagementPanel() {
  const [keys, setKeys] = useState<ApiKeyMetadata[]>([]);
  const [label, setLabel] = useState('');
  const [agentId, setAgentId] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !agentId) return;

    const randomSecret = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const fullApiKey = `vvu_live_${randomSecret}`;
    const newKeyId = `KEY-${Date.now().toString().substring(8)}`;

    const newKey: ApiKeyMetadata = {
      keyId: newKeyId,
      label: label.toUpperCase(),
      assignedAgent: agentId,
      secretPrefix: `${fullApiKey.substring(0, 12)}...`,
      createdAt: new Date().toLocaleDateString(),
    };

    setKeys((prev) => [newKey, ...prev]);
    setGeneratedKey(fullApiKey);
    setLabel('');
    setAgentId('');
  };

  const handleRevokeKey = (keyId: string) => {
    setKeys((prev) => prev.filter((k) => k.keyId !== keyId));
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-6 text-slate-100 font-mono">
      <h2 className="text-md font-bold tracking-wider text-teal-400 uppercase mb-4">
        🔑 Access Token Provisioning Console
      </h2>

      {/* Configuration Input Form */}
      <form
        onSubmit={handleGenerateKey}
        className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end mb-6"
      >
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
            Key Identifier Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="E.G., TRADING_BOT_ALPHA"
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
            Target Agent Binding ID
          </label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="E.G., Agent-8842"
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-teal-600 hover:bg-teal-500 font-bold transition-all text-xs rounded-md text-white tracking-widest"
        >
          GENERATE TOKEN
        </button>
      </form>

      {/* Secret Vault Display Container */}
      {generatedKey && (
        <div className="mb-6 p-3 bg-teal-950/20 border border-teal-800/40 rounded-lg text-xs">
          <p className="text-teal-400 font-bold mb-1">
            🔥 TOKEN GENERATED SUCCESSFULLY:
          </p>
          <code className="block bg-slate-950 p-2 rounded select-all break-all border border-slate-800 text-white font-bold">
            {generatedKey}
          </code>
          <span className="text-[10px] text-amber-500 block mt-1.5">
            ⚠️ Copy this token now. It will not be displayed again for security
            purposes.
          </span>
        </div>
      )}

      {/* API Token Directory Manifest Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[10px]">
            <tr>
              <th className="p-3">KEY ID</th>
              <th className="p-3">LABEL</th>
              <th className="p-3">BOUND AGENT</th>
              <th className="p-3">SECRET SNAPSHOT</th>
              <th className="p-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {keys.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-slate-500"
                >
                  No active access tokens provisioned for this environment.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.keyId} className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-400">{k.keyId}</td>
                  <td className="p-3 text-white font-bold">{k.label}</td>
                  <td className="p-3 text-teal-400">{k.assignedAgent}</td>
                  <td className="p-3 text-slate-500">
                    <code>{k.secretPrefix}</code>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleRevokeKey(k.keyId)}
                      className="px-2 py-0.5 bg-rose-950/40 border border-rose-800/40 text-rose-400 rounded hover:bg-rose-900/60 transition-all text-[10px]"
                    >
                      REVOKE
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
