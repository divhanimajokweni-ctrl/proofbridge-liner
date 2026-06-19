'use client';

import { useState, useEffect, useRef } from 'react';

function calcScore(r: number, c: number, e: number, g: number, share: number) {
  return Math.round(r * 0.25 + c * 0.20 + e * 0.20 + g * 0.20 + share * 0.15);
}

function getLevel(total: number) {
  if (total < 20) return { level: 'Novice', color: '#8B7355' };
  if (total < 40) return { level: 'Contributor', color: '#3D5A47' };
  if (total < 60) return { level: 'Steward', color: '#3D5A47' };
  if (total < 80) return { level: 'Guardian', color: '#E8A020' };
  return { level: 'Archivist', color: '#E8A020' };
}

const privs = [
  { min: 0, text: 'Join pools up to R2,000' },
  { min: 20, text: 'Create pools up to R5,000' },
  { min: 20, text: 'Propose governance improvements' },
  { min: 40, text: 'Verified pool creation' },
  { min: 40, text: 'Governance weight 1.5x' },
  { min: 60, text: 'Dispute arbitration rights' },
  { min: 60, text: 'Mentor new members (+endorsements)' },
  { min: 80, text: 'Protocol upgrades & CPME founding' },
  { min: 80, text: 'Trust seeding for new villages' },
];

const layers: Record<string, { title: string; desc: string; color: string; iconBg: string }> = {
  identity: { title: 'Identity — You Own It', desc: 'W3C DIDs anchored on ProofBridge. POPIA-compliant, minimal disclosure KYC. Your keys, your village vouches for you—not a bank.', color: 'var(--ink)', iconBg: 'var(--ink)' },
  trust: { title: 'Trust — Ubuntu Score', desc: 'Five signals weighted by community: Reciprocity (25%), Consistency (20%), Endorsements (20%), Governance (20%), Sharing (15%). GNN detects sybils via graph structure.', color: 'var(--sage)', iconBg: 'var(--sage)' },
  governance: { title: 'Governance — Liquid Democracy', desc: 'Ubuntu-weighted voting. Proposals need 67% quorum, 5-day timelock. Delegate to trusted Guardians. Every vote anchored.', color: 'var(--amber)', iconBg: 'var(--amber)' },
  village: { title: 'Village OS — ROSCA Engine', desc: 'Automated contributions, rotations, and payouts. Member-signed receipts, 60s ProofBridge anchoring, instant dispute rails. R0 disputed in pilot.', color: 'var(--ink)', iconBg: 'var(--ink)' },
  credit: { title: 'Credit — Reputation Unlocks Capital', desc: 'No collateral required. Score >60 unlocks microcredit; repayments raise Reciprocity. Social collateral replaces assets.', color: 'var(--sage)', iconBg: 'var(--sage)' },
  cpme: { title: 'CPME — Circular Economy', desc: 'Community Private Micro-Enterprises spin out of thriving pools. Revenue flows back to village treasury. I am because we are, in production.', color: 'var(--amber)', iconBg: 'var(--amber)' },
};

const chatResponses: Record<string, string> = {
  pool: "Village health: 94.2% consensus. 3 active pools in your cluster, 0 disputes in 90 days. Trust density +12% WoW. Next ProofBridge anchor in 18s. Ubuntu sustains you.",
  score: "To lift your Ubuntu Score 68→82: (1) maintain 3 on-time contributions (Consistency +8), (2) request 2 endorsements from Guardians, (3) vote on Proposal #47 today. Reciprocity compounds weekly.",
  gov: "Proposal #47: Increase Steward pool cap to R50k. Quorum 67% reached (71.3%). Your weight: 1.5x as Steward. Liquid democracy active—you can delegate to a trusted Guardian. Closes in 18h 42m.",
  sybil: "Sybil defense: Graph Neural Network scanning 12,441 edges. 0 anomalies detected. Your trust cluster: 23 verified vouches, clustering coefficient 0.81. POPIA consent receipts anchored.",
  default: "I'm analyzing the village trust graph across af-south-1. Ask me about pool velocity, score components, or create a pool to see ProofBridge anchoring live.",
};

const dashboardCard = {
  background: '#0d1117',
  border: '1px solid #1c2535',
  borderRadius: '8px',
};

export default function DashboardPage() {
  const [sliders, setSliders] = useState({ recip: 72, cons: 68, end: 65, gov: 58, share: 74 });
  const score = calcScore(sliders.recip, sliders.cons, sliders.end, sliders.gov, sliders.share);
  const { level, color } = getLevel(score);
  const circ = 2 * Math.PI * 56;
  const ringOffset = circ * (1 - score / 100);
  const [poolName, setPoolName] = useState('Gqeberha Builders');
  const [poolCreated, setPoolCreated] = useState(false);
  const [poolHash, setPoolHash] = useState('');
  const [selectedLayer, setSelectedLayer] = useState('identity');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'lindiwe'; text: string }[]>([
    { role: 'lindiwe', text: 'Molo! I am Lindiwe. I watch 847 pools across the village. "I am because we are" — how can I help your stokvel thrive today?' },
  ]);
  const [typing, setTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, typing]);

  const handlePoolSubmit = () => {
    const hashBytes = crypto.getRandomValues(new Uint8Array(24));
    const hash = 'pb_' + Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setPoolHash(hash);
    setPoolCreated(true);
  };

  const sendChat = (key?: string, custom?: string) => {
    const q = custom || key;
    if (!q) return;
    setChatLog((prev) => [...prev, { role: 'user', text: q }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setChatLog((prev) => [...prev, { role: 'lindiwe', text: chatResponses[key || 'default'] }]);
    }, 800 + Math.random() * 600);
    setChatInput('');
  };

  return (
    <div style={{ height: 'calc(100dvh - 64px)', background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace', overflow: 'auto' }}>
      <div style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c8a96e', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
          VILLAGE OS — OPERATIONS DASHBOARD
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Ubuntu Score Simulator */}
          <div style={{ ...dashboardCard, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 'bold' }}>Ubuntu Score Simulator</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#8F9CAE', marginTop: '-0.25rem' }}>Your reputation is your stake. 5 signals, weighted by the village.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#526660' }}>Authority</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color }}>{level}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem', alignItems: 'center', marginTop: '1.5rem' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="56" fill="none" stroke="#1c2535" strokeWidth="12" />
                  <circle cx="70" cy="70" r="56" fill="none" stroke="url(#scoreGradDash)" strokeWidth="12"
                    strokeDasharray="351.86" strokeDashoffset={ringOffset} strokeLinecap="round"
                    transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  <defs>
                    <linearGradient id="scoreGradDash" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#E8A020" />
                      <stop offset="100%" stopColor="#F2B84B" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#8F9CAE' }}>/ 100</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {([
                  ['recip', 'Reciprocity Index', '25%'],
                  ['cons', 'Consistency Score', '20%'],
                  ['end', 'Community Endorsements', '20%'],
                  ['gov', 'Governance Participation', '20%'],
                  ['share', 'Resource Sharing', '15%'],
                ] as const).map(([key, label, pct], i) => {
                  const val = sliders[key];
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <label style={{ fontWeight: 500 }}>{label} <span style={{ color: '#526660' }}>({pct})</span></label>
                        <span style={{ fontFamily: 'DM Mono, monospace' }}>{val}</span>
                      </div>
                      <input
                        type="range" min={0} max={100} value={val}
                        style={{ width: '100%', accentColor: '#E8A020', cursor: 'pointer' }}
                        onChange={(e) => setSliders((s) => ({ ...s, [key]: +e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1c2535' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#526660', marginBottom: '0.75rem' }}>Privileges Unlocked</div>
              <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                {privs.filter((p) => score >= p.min).map((p, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8A020', flexShrink: 0 }} />
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pool Creator */}
          <div style={{ ...dashboardCard, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 'bold' }}>Village OS Pool Creator</span>
                <p style={{ fontSize: '0.8rem', color: '#8F9CAE', marginTop: '0.25rem' }}>Create a ROSCA in 30 seconds. Anchored to ProofBridge.</p>
              </div>
              <span style={{
                padding: '4px 8px', fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
                borderRadius: '4px', background: 'var(--ink)', color: 'var(--bone)',
              }}>LIVE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#8F9CAE' }}>Pool Name</label>
                <input
                  value={poolName} onChange={(e) => setPoolName(e.target.value)}
                  placeholder="e.g., Gqeberha Builders"
                  style={{
                    marginTop: '0.25rem', width: '100%', padding: '0.625rem 0.75rem',
                    borderRadius: '8px', border: '1px solid #1c2535', background: '#0d1117',
                    color: '#FFF', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#8F9CAE' }}>Contribution (R)</label>
                  <input
                    type="number" min={100} max={10000} step={50} defaultValue={500}
                    style={{
                      marginTop: '0.25rem', width: '100%', padding: '0.625rem 0.75rem',
                      borderRadius: '8px', border: '1px solid #1c2535', background: '#0d1117',
                      color: '#FFF', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#8F9CAE' }}>Members (5-12)</label>
                  <input
                    type="number" min={5} max={12} defaultValue={8}
                    style={{
                      marginTop: '0.25rem', width: '100%', padding: '0.625rem 0.75rem',
                      borderRadius: '8px', border: '1px solid #1c2535', background: '#0d1117',
                      color: '#FFF', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none',
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handlePoolSubmit}
                style={{
                  width: '100%', padding: '0.625rem', borderRadius: '8px',
                  background: 'var(--ink)', color: 'white', border: 'none',
                  fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Create Pool & Anchor
              </button>
              <p style={{ fontSize: '0.65rem', color: '#526660', textAlign: 'center' }}>
                ED25519 signatures · 60s ProofBridge anchoring · POPIA minimal disclosure
              </p>
            </div>

            {poolCreated && (
              <div style={{
                marginTop: '1rem', padding: '1rem', borderRadius: '12px',
                border: '1px solid #1c2535', background: '#0a0d12',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 'bold' }}>{poolName}</div>
                  <div style={{
                    fontSize: '0.65rem', fontFamily: 'DM Mono, monospace', padding: '2px 8px',
                    borderRadius: '4px', background: 'rgba(62,207,142,0.15)', color: '#3ecf8e',
                    border: '1px solid rgba(62,207,142,0.3)',
                  }}>HEALTHY</div>
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#8F9CAE', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                  {poolHash}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#0d1117', border: '1px solid #1c2535' }}>
                    <div style={{ fontSize: '0.65rem', color: '#526660' }}>Trust</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>96%</div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#0d1117', border: '1px solid #1c2535' }}>
                    <div style={{ fontSize: '0.65rem', color: '#526660' }}>Consensus</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>98.4%</div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#0d1117', border: '1px solid #1c2535' }}>
                    <div style={{ fontSize: '0.65rem', color: '#526660' }}>Next Payout</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>12d</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Architecture Visualizer */}
          <div style={{ ...dashboardCard, padding: '1.5rem' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 'bold' }}>Architecture Visualizer</span>
            <p style={{ fontSize: '0.8rem', color: '#8F9CAE', marginTop: '0.25rem', marginBottom: '1rem' }}>Click a layer. See how Ubuntu compounds.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(layers).map(([key, l]) => (
                <div
                  key={key}
                  onClick={() => setSelectedLayer(key)}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '8px',
                    border: '1px solid #1c2535', cursor: 'pointer',
                    background: selectedLayer === key ? 'rgba(232,160,32,0.06)' : 'linear-gradient(180deg,#12151A,#0D1015)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    borderColor: selectedLayer === key ? '#E8A020' : '#1c2535',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: l.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: l.iconBg === 'var(--amber)' ? '#000' : '#FFF',
                      fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', fontWeight: 'bold',
                    }}>
                      {Object.keys(layers).indexOf(key) + 1}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.title.split(' — ')[0]}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#526660' }}>{l.title.split(' — ')[1] || l.title}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '1rem', padding: '1rem', borderRadius: '8px',
              background: 'rgba(245,240,232,0.03)', border: '1px solid #1c2535', minHeight: '80px',
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                {layers[selectedLayer].title}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#8F9CAE', lineHeight: 1.6 }}>{layers[selectedLayer].desc}</p>
            </div>
          </div>

          {/* Lindiwe AI Console */}
          <div style={{ ...dashboardCard, padding: 0, overflow: 'hidden', gridColumn: '1 / -1' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
              <div style={{
                borderBottom: '1px solid #1c2535', padding: '1.25rem',
                background: 'rgba(13,17,23,0.5)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--sage)', color: 'var(--warm-white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif', fontWeight: 'bold', fontSize: '1rem',
                  }}>L</div>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 'bold', fontSize: '0.9rem' }}>LINDIWE</div>
                    <div style={{ fontSize: '0.6rem', color: '#526660', fontFamily: 'DM Mono, monospace' }}>CENTRAL NERVOUS SYSTEM</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#8F9CAE', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Ask about pool health, score improvement, governance, or sybil defense. I learn from the trust graph.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                  {(['pool', 'score', 'gov', 'sybil'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => sendChat(k)}
                      style={{
                        padding: '6px 10px', borderRadius: '6px',
                        border: '1px solid #1c2535', background: '#0d1117',
                        color: '#b8b8c4', fontSize: '0.75rem', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {k === 'pool' ? 'Pool health' : k === 'score' ? 'Improve score' : k === 'gov' ? 'Governance' : 'Sybil defense'}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#526660', fontFamily: 'DM Mono, monospace' }}>
                  Latency 42ms · af-south-1 · Encrypted
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}>
                  {chatLog.map((m, i) => (
                    <div key={i} style={{
                      maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem', borderRadius: '16px',
                        background: m.role === 'user' ? 'var(--sage)' : '#1c2535',
                        color: m.role === 'user' ? 'white' : '#e6edf3',
                        fontSize: '0.85rem', lineHeight: 1.5,
                      }}>{m.text}</div>
                    </div>
                  ))}
                  {typing && (
                    <div style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: '#526660', padding: '0.5rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8A020', display: 'inline-block', animation: 'pulse 1.4s infinite', marginRight: '6px' }} />
                      Analyzing trust graph...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) sendChat(undefined, chatInput); }}
                  style={{
                    padding: '0.75rem 1rem', borderTop: '1px solid #1c2535',
                    display: 'flex', gap: '8px',
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Lindiwe about your village..."
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #1c2535', background: '#0d1117',
                      color: '#FFF', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      background: 'var(--sage)', color: 'white', border: 'none',
                      fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
