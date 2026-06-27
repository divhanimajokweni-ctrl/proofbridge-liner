'use client';

import { useState, useEffect } from 'react';

const C = {
  void:     "#07090C",
  bg:       "#0D1117",
  surf:     "#121925",
  card:     "#16202E",
  border:   "#1C2A38",
  bHov:     "#243546",
  crimson:  "#8C1A3E",
  crimBr:   "#C4254F",
  crimD:    "rgba(140,26,62,0.12)",
  crimB:    "rgba(140,26,62,0.32)",
  gold:     "#C8A84A",
  goldBr:   "#E4C86A",
  goldD:    "rgba(200,168,74,0.11)",
  goldB:    "rgba(200,168,74,0.28)",
  green:    "#1CAF70",
  greenD:   "rgba(28,175,112,0.12)",
  orange:   "#D07E18",
  orangeD:  "rgba(208,126,24,0.12)",
  blue:     "#4A9EE8",
  blueD:    "rgba(74,158,232,0.12)",
  purple:   "#8B5DE5",
  purpleD:  "rgba(139,93,229,0.12)",
  red:      "#CC3030",
  redD:     "rgba(204,48,48,0.12)",
  t1:       "#DCE2EA",
  t2:       "#6A8099",
  t3:       "#334658",
};

const SYNE = "'Syne', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const BODY = "'DM Sans', sans-serif";
const RELEASE = new Date("2026-07-30T00:00:00+02:00");
const GATE_PIN = "2026";
const VCT_FP = "ED25519::a3f7·2e9b·1c84·d655·3fe2·9ac0·1178·4b3d";

const ENTITIES = [
  {
    id:"pools", name:"Ubuntu Pools", tag:"ROSCA / STOKVEL",
    status:"PILOT", sc:C.orange, color:C.gold, icon:"◎",
    desc:"Community savings OS. ROSCA rotation cycles. Stitch InstantEFT payment rail. Ubuntu Score governance weighting.",
    metrics:[
      {l:"Active Cycles",   v:"3"},
      {l:"Payment Rail",    v:"Stitch"},
      {l:"Ubuntu Score",    v:"74 / 100"},
      {l:"Governance Tier", v:"Guardian"},
      {l:"POPIA §18",       v:"Compliant"},
      {l:"WhatsApp Native", v:"Yes"},
    ],
    events:[
      "ROSCA cycle #2 opened · payout scheduled",
      "Stitch webhook HMAC-SHA256 verified",
      "Ubuntu Score recalibrated → 74",
      "Governance Simulator live at pilot demo",
    ],
  },
  {
    id:"pb", name:"ProofBridge Liner", tag:"ZK / COMPLIANCE",
    status:"T-34 DAYS", sc:C.crimBr, color:C.crimson, icon:"⬡",
    desc:"ZK pre-settlement compliance fabric. Bayesian safety kernel. On-chain circuit breaker for RWA tokenisation. Polygon Amoy testnet.",
    chain:"Polygon Amoy", addr:"0x770342c49e1F4710E0Eed605dCe41e7f3F7600Eb",
    metrics:[
      {l:"Open Findings",    v:"18"},
      {l:"Hard Failures",    v:"5"},
      {l:"Blocking Gates",   v:"16"},
      {l:"Remediation Est.", v:"18–22 days"},
      {l:"Network",          v:"Polygon Amoy"},
      {l:"Release Target",   v:"2026-07-30"},
    ],
    events:[
      "ZK signal schema divergence patched vs circuit source",
      "ED25519 VCT → keccak256 commitment resolved (offchain Go gate)",
      "GovernanceAnchor.sol deployed 0x7703…600Eb",
      "compliance-fabric branch protected · main is mirror-only",
      "Node.js all-systems-integrator supervisor rewrite in progress",
    ],
  },
  {
    id:"sk", name:"SafeKrypte", tag:"HSM-AS-A-SERVICE",
    status:"DEV", sc:C.green, color:C.green, icon:"⊕",
    desc:"Cryptographic root of trust. Threshold escrow 3-of-5 SSS internal / 5-of-7 institutional MPC. VCT bound to founder ED25519.",
    metrics:[
      {l:"Internal SSS",     v:"3-of-5"},
      {l:"Institutional MPC",v:"5-of-7"},
      {l:"VCT Binding",      v:"ED25519"},
      {l:"Key Ceremony",     v:"5-of-7 Q3 2026"},
      {l:"Status",           v:"Active Dev"},
      {l:"Integration",      v:"ProofBridge / VCT"},
    ],
    events:[
      "Threshold escrow policy formalised",
      "5-of-7 key ceremony scheduled Q3 2026",
      "VCT ED25519 cryptographic binding confirmed",
    ],
  },
  {
    id:"sg", name:"SafeGrid", tag:"WATER / NMBM",
    status:"DEV", sc:C.blue, color:C.blue, icon:"≋",
    desc:"Nelson Mandela Bay water infrastructure. FROST-DAML Rust middleware. Community Prosperity Water Trust — 15% net profit distribution.",
    metrics:[
      {l:"Coverage",         v:"NMBM"},
      {l:"Trust Distribution",v:"15% Net Profit"},
      {l:"FROST-DAML",       v:"v3"},
      {l:"Replay Safety",    v:"Semantic Nonce"},
      {l:"Community Owned",  v:"Yes"},
      {l:"DAML JSON API",    v:"Optional Enc."},
    ],
    events:[
      "FROST-DAML v3 replay-safety via semantic nonce derivation",
      "15% NPD community trust architecture formalised",
      "DAML JSON API Optional encoding verified",
      "NMBM Community Prosperity Water Trust charter active",
    ],
  },
  {
    id:"ekasi", name:"Ekasi", tag:"UBUNTU GAMES / RPG",
    status:"PRE-PROD", sc:C.purple, color:C.purple, icon:"◈",
    desc:"Pan-African open-world RPG set in fictional township metropolis. GDD complete. IP protection via CIPC trademark + Madrid Protocol.",
    metrics:[
      {l:"GDD Status",       v:"Complete"},
      {l:"IP — CIPC",        v:"Trademark Pending"},
      {l:"IP — Madrid",      v:"Pathway Active"},
      {l:"Setting",          v:"Pan-African Metro"},
      {l:"Genre",            v:"Township Open-World"},
      {l:"Engine",           v:"TBD"},
    ],
    events:[
      "GDD finalised with full IP protection strategy",
      "CIPC trademark application submitted",
      "Madrid Protocol pathway identified",
      "African creative IP architecture documented",
    ],
  },
  {
    id:"lindiwe", name:"Lindiwe AI", tag:"INTERNAL INTELLIGENCE",
    status:"ACTIVE", sc:C.green, color:C.orange, icon:"◆",
    desc:"Internal AI intelligence layer. FastMCP 15-tool stdio server. Ubuntu Data Bus integration via NATS JetStream.",
    metrics:[
      {l:"MCP Tools",        v:"15"},
      {l:"Protocol",         v:"FastMCP stdio"},
      {l:"Event Bus",        v:"NATS JetStream"},
      {l:"Namespaces",       v:"7 (34 events)"},
      {l:"Lean 4",           v:"v1.2.2"},
      {l:"Status",           v:"Active"},
    ],
    events:[
      "FastMCP 15-tool stdio server deployed",
      "NATS JetStream 34-event schema across 7 namespaces live",
      "Lean 4 formalization pipeline v1.2.2 · pass@k correctness fixed",
      "FAISS retrieval + LLM repair loop active",
    ],
  },
];

const NAV = [
  {id:"command",  label:"COMMAND",      icon:"⌘", sep:false},
  {id:"pools",    label:"UBUNTU POOLS", icon:"◎", sep:false},
  {id:"pb",       label:"PROOFBRIDGE",  icon:"⬡", sep:false},
  {id:"sk",       label:"SAFEKRYPTE",   icon:"⊕", sep:false},
  {id:"sg",       label:"SAFEGRID",     icon:"≋", sep:false},
  {id:"ekasi",    label:"EKASI",        icon:"◈", sep:false},
  {id:"lindiwe",  label:"LINDIWE AI",   icon:"◆", sep:true },
  {id:"gov",      label:"GOVERNANCE",   icon:"⚑", sep:false},
  {id:"systems",  label:"SYSTEMS",      icon:"≡", sep:false},
];

const GATES = [
  {id:"A", name:"Identity & Auth",      status:"COMPLETE", sc:C.green},
  {id:"B", name:"Trust Score Engine",   status:"COMPLETE", sc:C.green},
  {id:"C", name:"Governance Layer",     status:"COMPLETE", sc:C.green},
  {id:"D", name:"GovernanceAnchor.sol", status:"DEPLOYED", sc:C.green},
  {id:"E", name:"Veto Gate API",        status:"COMPLETE", sc:C.green},
  {id:"F", name:"Ubuntu Data Bus",      status:"ACTIVE",   sc:C.green},
  {id:"G", name:"FROST-DAML",          status:"DEV",      sc:C.orange},
  {id:"H", name:"ProofBridge Liner",    status:"T-34",     sc:C.crimBr},
];

const p2 = (n: number) => String(n).padStart(2,"0");

function getCD() {
  const d = RELEASE.getTime() - new Date().getTime();
  if (d <= 0) return {d:0,h:0,m:0,s:0};
  return {
    d: Math.floor(d/86400000),
    h: Math.floor((d%86400000)/3600000),
    m: Math.floor((d%3600000)/60000),
    s: Math.floor((d%60000)/1000),
  };
}

const GCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@300;400;500;600&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: #07090C; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: #0D1117; }
  ::-webkit-scrollbar-thumb { background: #1C2A38; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #C8A84A; }
  @keyframes pinShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{opacity:.88;text-shadow:0 0 14px rgba(200,168,74,.2)} 50%{opacity:1;text-shadow:0 0 28px rgba(200,168,74,.7)} }
  @keyframes ring { 0%,100%{box-shadow:0 0 0 0 rgba(28,175,112,.5)} 50%{box-shadow:0 0 0 5px rgba(28,175,112,0)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes popIn { 0%{opacity:0;transform:scale(.9)} 100%{opacity:1;transform:scale(1)} }
  .nv { cursor:pointer; transition:all .15s ease; border-left:2px solid transparent !important; }
  .nv:hover { background: rgba(200,168,74,.07) !important; }
  .nv.act { background: rgba(200,168,74,.11) !important; border-left-color: #C8A84A !important; }
  .ec { transition: transform .2s ease, border-color .2s ease; cursor:pointer; }
  .ec:hover { transform:translateY(-2px); border-color: rgba(200,168,74,.4) !important; }
  .pb-btn { transition: all .15s ease; cursor:pointer; }
  .pb-btn:hover:not(:disabled) { background: rgba(200,168,74,.16) !important; border-color: rgba(200,168,74,.45) !important; color: #E4C86A !important; }
  .pb-btn:active:not(:disabled) { transform: scale(.94); }
`;

function PinScreen({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin]     = useState("");
  const [err, setErr]     = useState(false);
  const [ok, setOk]       = useState(false);

  const tap = (d: string) => {
    if (err || ok) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === GATE_PIN) { setOk(true); setTimeout(onAuth, 500); }
      else { setErr(true); setTimeout(() => { setPin(""); setErr(false); }, 900); }
    }
  };
  const del = () => { if (!err && !ok) setPin(p => p.slice(0,-1)); };

  const dotColor = err ? C.crimBr : ok ? C.green : C.gold;

  return (
    <div style={{
      position:"fixed", inset:0,
      background:`radial-gradient(ellipse 70% 60% at 50% 45%, rgba(140,26,62,.09) 0%, ${C.void} 65%)`,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily: MONO, zIndex:9999,
    }}>
      <style>{GCSS}</style>
      {[440, 320, 200].map((sz, i) => (
        <div key={i} style={{
          position:"absolute", width:sz, height:sz, borderRadius:"50%",
          border:`1px solid rgba(200,168,74,${0.03 + i*0.02})`,
          pointerEvents:"none",
        }} />
      ))}
      <div style={{textAlign:"center", marginBottom:48, animation:"fadeUp .7s ease"}}>
        <div style={{
          display:"flex", justifyContent:"center", alignItems:"center",
          marginBottom:16, position:"relative", height:52,
        }}>
          {[
            {color:C.gold, x:-16, y:-8, size:32},
            {color:"#A8A090", x:16, y:-8, size:32},
            {color:"#C8A84A88", x:0, y:10, size:28},
          ].map((ring, i) => (
            <div key={i} style={{
              position:"absolute",
              left:`calc(50% + ${ring.x}px)`,
              top:`calc(50% + ${ring.y}px)`,
              transform:"translate(-50%,-50%)",
              width:ring.size, height:ring.size,
              borderRadius:"50%",
              border:`2.5px solid ${ring.color}`,
            }} />
          ))}
        </div>
        <div style={{fontFamily:SYNE, fontWeight:800, fontSize:28, color:C.t1, letterSpacing:4, marginBottom:6}}>
          VVU GATEWAY OS
        </div>
        <div style={{fontSize:9, color:C.t3, letterSpacing:5}}>RESTRICTED ACCESS</div>
      </div>

      <div style={{
        display:"flex", gap:18, marginBottom:32,
        animation: err ? "pinShake .55s ease" : "none",
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:13, height:13, borderRadius:"50%",
            background: i < pin.length ? dotColor : "transparent",
            border:`1.5px solid ${i < pin.length ? dotColor : C.border}`,
            boxShadow: i < pin.length ? `0 0 10px ${dotColor}60` : "none",
            transition:"all .2s",
          }} />
        ))}
      </div>

      <div style={{height:16, marginBottom:20, textAlign:"center"}}>
        {err && <div style={{fontFamily:MONO, fontSize:10, color:C.crimBr, letterSpacing:3}}>ACCESS DENIED</div>}
        {ok  && <div style={{fontFamily:MONO, fontSize:10, color:C.green,  letterSpacing:3}}>AUTHENTICATED</div>}
        {!err && !ok && <div style={{fontFamily:MONO, fontSize:10, color:C.t3, letterSpacing:3}}>ENTER PIN</div>}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, width:220}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => {
          const empty = d === "";
          const isDel = d === "⌫";
          return (
            <button key={i} onClick={() => empty ? null : isDel ? del() : tap(String(d))}
              disabled={empty}
              className={empty ? "" : "pb-btn"}
              style={{
                height:60, borderRadius:8,
                background: empty ? "transparent" : C.surf,
                border:`1px solid ${empty ? "transparent" : C.border}`,
                color: isDel ? C.t2 : C.t1,
                fontSize: isDel ? 18 : 22,
                fontFamily: MONO, fontWeight:400,
                cursor: empty ? "default" : "pointer",
              }}
            >{d}</button>
          );
        })}
      </div>

      <div style={{marginTop:44, fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:3}}>
        CIPC 2026/259053/07 · GQEBERHA, EC, ZA
      </div>
    </div>
  );
}

function Header({clock}: {clock: Date}) {
  return (
    <div style={{
      height:52, flexShrink:0,
      background:C.bg, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", padding:"0 20px", gap:14,
    }}>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <div style={{
          width:32, height:32, position:"relative",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {[{c:C.gold,x:-5,y:-4,s:18},{c:"#8A9090",x:5,y:-4,s:18},{c:C.gold+"88",x:0,y:6,s:15}].map((r,i)=>(
            <div key={i} style={{
              position:"absolute", width:r.s, height:r.s, borderRadius:"50%",
              border:`2px solid ${r.c}`,
              left:r.x+8, top:r.y+8,
            }}/>
          ))}
        </div>
        <div>
          <div style={{fontFamily:SYNE, fontWeight:800, fontSize:12.5, color:C.t1, letterSpacing:2.5}}>
            VVU GATEWAY OS
          </div>
          <div style={{fontFamily:MONO, fontSize:8, color:C.t3, letterSpacing:1.5}}>
            THE UBUNTU GROUP · INTERNAL
          </div>
        </div>
      </div>

      <div style={{flex:1}}/>

      <div style={{background:C.blueD, border:`1px solid rgba(74,158,232,.28)`, borderRadius:4, padding:"3px 9px"}}>
        <span style={{fontFamily:MONO, fontSize:8.5, color:C.blue}}>POLYGON AMOY</span>
      </div>

      <div style={{fontFamily:MONO, fontSize:11, color:C.t2}}>
        {p2(clock.getHours())}:{p2(clock.getMinutes())}:{p2(clock.getSeconds())} SAST
      </div>

      <div style={{display:"flex", alignItems:"center", gap:7}}>
        <div style={{
          width:7, height:7, borderRadius:"50%",
          background:C.green, animation:"ring 2.4s infinite",
        }}/>
        <span style={{fontFamily:MONO, fontSize:8.5, color:C.green}}>NOMINAL</span>
      </div>

      <div style={{
        background:C.crimD, border:`1px solid ${C.crimB}`,
        borderRadius:4, padding:"4px 11px",
      }}>
        <span style={{fontFamily:MONO, fontSize:9, color:C.crimBr, letterSpacing:1}}>
          MINO · FOUNDER · 75% + VETO
        </span>
      </div>
    </div>
  );
}

function Sidebar({active, set}: {active: string; set: (id: string) => void}) {
  return (
    <div style={{
      width:186, flexShrink:0,
      background:C.bg, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", overflowY:"auto",
    }}>
      <div style={{flex:1, padding:"10px 0"}}>
        {NAV.map(n => (
          <div key={n.id}>
            {n.sep && <div style={{height:1, background:C.border, margin:"8px 14px"}}/>}
            <div
              onClick={() => set(n.id)}
              className={`nv ${active===n.id?"act":""}`}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 16px",
                borderLeft:`2px solid ${active===n.id ? C.gold : "transparent"}`,
                background: active===n.id ? "rgba(200,168,74,.11)" : "transparent",
              }}
            >
              <span style={{fontSize:13, width:16, textAlign:"center", color: active===n.id ? C.gold : C.t3}}>
                {n.icon}
              </span>
              <span style={{fontFamily:MONO, fontSize:9.5, letterSpacing:1.5, color: active===n.id ? C.t1 : C.t2}}>
                {n.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{padding:"12px 14px", borderTop:`1px solid ${C.border}`}}>
        <div style={{fontFamily:MONO, fontSize:7.5, color:C.t3, letterSpacing:1.5, marginBottom:5}}>VCT · ED25519</div>
        <div style={{fontFamily:MONO, fontSize:7, color:C.t3, lineHeight:1.8, wordBreak:"break-all"}}>
          a3f7·2e9b·1c84·d655<br/>3fe2·9ac0·1178·4b3d
        </div>
        <div style={{fontFamily:MONO, fontSize:7, color:C.t3, marginTop:6}}>CIPC 2026/259053/07</div>
      </div>
    </div>
  );
}

function CommandView({cd}: {cd: {d: number; h: number; m: number; s: number}}) {
  const [bars, setBars] = useState(Array(34).fill(0.3));
  useEffect(() => {
    const t = setInterval(() => setBars(b => [...b.slice(1), .2+Math.random()*.8]), 380);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{padding:24, overflowY:"auto", height:"100%", animation:"fadeUp .4s ease"}}>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20}}>
        {[
          {lbl:"PRODUCTION IN",  val:`${cd.d}D ${p2(cd.h)}H`, sub:"ProofBridge · 2026-07-30", vc:C.gold},
          {lbl:"ENTITIES",       val:"6",  sub:"Portfolio Active", vc:C.goldBr},
          {lbl:"OPEN FINDINGS",  val:"18", sub:"5 Hard Failures",  vc:C.crimBr},
          {lbl:"RELEASE GATES",  val:"16", sub:"Blocking",         vc:C.orange},
        ].map((s,i) => (
          <div key={i} style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:"16px 18px"}}>
            <div style={{fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:2, marginBottom:8}}>{s.lbl}</div>
            <div style={{fontFamily:SYNE, fontWeight:700, fontSize:24, color:s.vc, lineHeight:1, marginBottom:5}}>{s.val}</div>
            <div style={{fontFamily:MONO, fontSize:8.5, color:C.t2}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background:`linear-gradient(135deg, rgba(140,26,62,.16) 0%, rgba(200,168,74,.07) 100%)`,
        border:`1px solid rgba(140,26,62,.38)`,
        borderRadius:8, padding:"18px 24px", marginBottom:20,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{fontFamily:MONO, fontSize:9.5, color:C.crimBr, letterSpacing:2, marginBottom:6}}>
            ⚑ PROOFBRIDGE LINER · PRODUCTION RELEASE TARGET
          </div>
          <div style={{fontFamily:MONO, fontSize:10, color:C.t2}}>
            Polygon Mainnet · FSCA CASP Submission · 18–22 engineering days remaining
          </div>
        </div>
        <div style={{display:"flex", gap:20, alignItems:"center"}}>
          {[["DAYS",cd.d],["HRS",cd.h],["MIN",cd.m],["SEC",cd.s]].map(([l,v]) => (
            <div key={l} style={{textAlign:"center"}}>
              <div style={{
                fontFamily:MONO, fontWeight:600, fontSize:30,
                color:C.gold, lineHeight:1, minWidth:48, textAlign:"center",
                animation:"glow 2.2s infinite",
              }}>{p2(v as number)}</div>
              <div style={{fontFamily:MONO, fontSize:8, color:C.t3, letterSpacing:2.5, marginTop:5}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20}}>
        {ENTITIES.map(e => (
          <div key={e.id} className="ec" style={{
            background:C.surf, border:`1px solid ${C.border}`,
            borderRadius:8, padding:16,
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
              <span style={{fontSize:22, color:e.color, lineHeight:1}}>{e.icon}</span>
              <div style={{
                background:`${e.sc}22`, border:`1px solid ${e.sc}50`,
                borderRadius:20, padding:"3px 9px",
                fontFamily:MONO, fontSize:8, color:e.sc, letterSpacing:1,
              }}>{e.status}</div>
            </div>
            <div style={{fontFamily:SYNE, fontWeight:700, fontSize:13, color:C.t1, marginBottom:2}}>{e.name}</div>
            <div style={{fontFamily:MONO, fontSize:8.5, color:e.color, letterSpacing:1.5, marginBottom:9}}>{e.tag}</div>
            <div style={{fontFamily:BODY, fontSize:11, color:C.t2, lineHeight:1.55, marginBottom:10}}>{e.desc}</div>
            <div style={{borderTop:`1px solid ${C.border}`, paddingTop:9}}>
              {e.metrics.slice(0,3).map(m => (
                <div key={m.l} style={{
                  display:"flex", justifyContent:"space-between",
                  padding:"3px 0",
                }}>
                  <span style={{fontFamily:MONO, fontSize:8, color:C.t3}}>{m.l}</span>
                  <span style={{fontFamily:MONO, fontSize:8, color:C.t1}}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:16}}>
          <div style={{fontFamily:MONO, fontSize:9, color:C.t3, letterSpacing:2, marginBottom:12}}>GOVERNANCE SNAPSHOT</div>
          {[
            {l:"GovernanceAnchor.sol", v:"0x7703…600Eb", s:"✓", sc:C.green},
            {l:"Veto Gate API",        v:"Go · ED25519",  s:"✓", sc:C.green},
            {l:"VCT Binding",          v:"Mino 75%",      s:"✓", sc:C.green},
            {l:"FSCA CASP",            v:"Pending",        s:"⚠", sc:C.orange},
            {l:"FICA RMCP",            v:"BLOCKING",       s:"✗", sc:C.red},
            {l:"PAIA Manual",          v:"MISSING",        s:"✗", sc:C.red},
          ].map(row => (
            <div key={row.l} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"5px 0", borderBottom:`1px solid ${C.border}`,
            }}>
              <span style={{fontFamily:MONO, fontSize:8.5, color:C.t2}}>{row.l}</span>
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <span style={{fontFamily:MONO, fontSize:8, color:C.t3}}>{row.v}</span>
                <span style={{fontSize:11, color:row.sc}}>{row.s}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:16}}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}>
            <div style={{fontFamily:MONO, fontSize:9, color:C.t3, letterSpacing:2}}>SYSTEM PULSE</div>
            <div style={{fontFamily:MONO, fontSize:9, color:C.green}}>● LIVE</div>
          </div>
          <div style={{display:"flex", alignItems:"flex-end", height:76, gap:2.5, marginBottom:14}}>
            {bars.map((v,i) => {
              const mx = Math.max(...bars, .01);
              return (
                <div key={i} style={{
                  flex:1, borderRadius:1.5,
                  height:`${(v/mx)*100}%`,
                  background: i >= bars.length-4 ? C.gold : "rgba(200,168,74,.24)",
                  transition:"height .32s ease",
                }}/>
              );
            })}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
            {[
              {l:"NATS",   v:"JetStream ✓"},
              {l:"Lean 4", v:"v1.2.2 ✓"},
              {l:"Amoy",   v:"Connected"},
            ].map(m => (
              <div key={m.l}>
                <div style={{fontFamily:MONO, fontSize:7.5, color:C.t3}}>{m.l}</div>
                <div style={{fontFamily:MONO, fontSize:8.5, color:C.green}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EntityDetail({e}: {e: (typeof ENTITIES)[number]}) {
  return (
    <div style={{padding:24, overflowY:"auto", height:"100%", animation:"fadeUp .4s ease"}}>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:22}}>
        <div style={{fontSize:48, color:e.color, lineHeight:1}}>{e.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:SYNE, fontWeight:800, fontSize:20, color:C.t1}}>{e.name}</div>
          <div style={{fontFamily:MONO, fontSize:9.5, color:e.color, letterSpacing:2, marginTop:3}}>{e.tag}</div>
        </div>
        <div style={{
          background:`${e.sc}22`, border:`1px solid ${e.sc}50`,
          borderRadius:4, padding:"7px 16px",
          fontFamily:MONO, fontSize:11, color:e.sc, letterSpacing:2,
        }}>{e.status}</div>
      </div>

      <div style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:18, marginBottom:16}}>
        <div style={{fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:2, marginBottom:8}}>DESCRIPTION</div>
        <div style={{fontFamily:BODY, fontSize:13, color:C.t1, lineHeight:1.7}}>{e.desc}</div>
        {e.addr && (
          <div style={{marginTop:10, fontFamily:MONO, fontSize:9, color:C.gold}}>
            <span style={{color:C.t3}}>CONTRACT </span>{e.addr}
          </div>
        )}
        {e.chain && (
          <div style={{marginTop:4, fontFamily:MONO, fontSize:9, color:C.blue}}>
            <span style={{color:C.t3}}>NETWORK </span>{e.chain}
          </div>
        )}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16}}>
        {e.metrics.map(m => (
          <div key={m.l} style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:"13px 15px"}}>
            <div style={{fontFamily:MONO, fontSize:8, color:C.t3, marginBottom:5}}>{m.l}</div>
            <div style={{fontFamily:MONO, fontWeight:500, fontSize:12.5, color:C.t1}}>{m.v}</div>
          </div>
        ))}
      </div>

      <div style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:16}}>
        <div style={{fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:2, marginBottom:12}}>RECENT EVENTS</div>
        {e.events.map((ev,i) => (
          <div key={i} style={{
            display:"flex", gap:10, alignItems:"flex-start",
            padding:"7px 0", borderBottom: i<e.events.length-1 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{fontFamily:MONO, fontSize:9, color:C.gold, flexShrink:0, marginTop:1}}>→</span>
            <span style={{fontFamily:MONO, fontSize:9, color:C.t2, lineHeight:1.55}}>{ev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GovernanceView() {
  return (
    <div style={{padding:24, overflowY:"auto", height:"100%", animation:"fadeUp .4s ease"}}>
      <div style={{fontFamily:SYNE, fontWeight:800, fontSize:18, color:C.t1, marginBottom:5}}>Governance Architecture</div>
      <div style={{fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:1, marginBottom:20}}>
        VCT · ED25519 · GovernanceAnchor.sol · Veto Gate · Denomination Share
      </div>

      <div style={{
        background:`linear-gradient(135deg, ${C.crimD} 0%, transparent 100%)`,
        border:`1px solid ${C.crimB}`, borderRadius:8, padding:20, marginBottom:14,
      }}>
        <div style={{fontFamily:MONO, fontSize:9.5, color:C.crimBr, letterSpacing:2, marginBottom:14}}>
          VETO CLEARANCE TOKEN (VCT)
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
          {[
            {l:"Algorithm",  v:"ED25519"},
            {l:"Bound To",   v:"Mino (Founder)"},
            {l:"Share Class",v:"Denomination"},
            {l:"Majority",   v:"75% + Absolute Veto"},
            {l:"On-chain",   v:"keccak256 commitment"},
            {l:"Off-chain",  v:"Go Veto Gate API"},
          ].map(m => (
            <div key={m.l} style={{
              background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:"11px 14px",
            }}>
              <div style={{fontFamily:MONO, fontSize:7.5, color:C.t3, marginBottom:4}}>{m.l}</div>
              <div style={{fontFamily:MONO, fontSize:11, color:C.t1}}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop:14, padding:"10px 14px",
          background:"rgba(0,0,0,.3)", borderRadius:6,
          fontFamily:MONO, fontSize:8.5, color:C.t3,
        }}>
          Fingerprint: <span style={{color:C.gold}}>{VCT_FP}</span>
        </div>
      </div>

      <div style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:20, marginBottom:14}}>
        <div style={{fontFamily:MONO, fontSize:9, color:C.t3, letterSpacing:2, marginBottom:14}}>
          DEPLOYMENT GATES (A–H)
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          {GATES.map(g => (
            <div key={g.id} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:"9px 13px",
            }}>
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <span style={{fontFamily:MONO, fontSize:8.5, color:C.gold}}>Gate {g.id}</span>
                <span style={{fontFamily:MONO, fontSize:8.5, color:C.t2}}>{g.name}</span>
              </div>
              <span style={{fontFamily:MONO, fontSize:8, color:g.sc}}>{g.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:20}}>
        <div style={{fontFamily:MONO, fontSize:9, color:C.t3, letterSpacing:2, marginBottom:14}}>
          SHAREHOLDER REGISTER
        </div>
        {[
          {name:"Mihle Iviwe 'Divhani' Majokweni", role:"Founder & Chief Architect", pct:"75%", vc:C.gold},
          {name:"Mila",                          role:"Shareholder",              pct:"5%",  vc:C.t1},
          {name:"Enoch",                         role:"Shareholder",              pct:"5%",  vc:C.t1},
          {name:"Employee Fund",                 role:"Charter Mandate",          pct:"15%", vc:C.t2},
        ].map(s => (
          <div key={s.name} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"9px 0", borderBottom:`1px solid ${C.border}`,
          }}>
            <div>
              <div style={{fontFamily:MONO, fontSize:9.5, color:s.vc}}>{s.name}</div>
              <div style={{fontFamily:MONO, fontSize:8, color:C.t3, marginTop:2}}>{s.role}</div>
            </div>
            <div style={{fontFamily:SYNE, fontWeight:700, fontSize:15, color:s.vc}}>{s.pct}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemsView() {
  return (
    <div style={{padding:24, overflowY:"auto", height:"100%", animation:"fadeUp .4s ease"}}>
      <div style={{fontFamily:SYNE, fontWeight:800, fontSize:18, color:C.t1, marginBottom:5}}>
        System Infrastructure
      </div>
      <div style={{fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:1, marginBottom:20}}>
        NATS JetStream · Lean 4 · ZK Circuits · Git Protocol · Compliance Gates
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        {[
          {
            title:"NATS JETSTREAM",
            rows:[
              {l:"Namespaces",  v:"7",                 vc:C.green},
              {l:"Event Types", v:"34",                vc:C.green},
              {l:"Schema",      v:"Protobuf + JSON",   vc:C.green},
              {l:"Ubuntu Bus",  v:"ACTIVE",            vc:C.green},
              {l:"Supervisor",  v:"Rewrite Active",    vc:C.orange},
            ]
          },
          {
            title:"ZK CIRCUIT STATUS",
            rows:[
              {l:"Signal Schema",  v:"PATCHED",       vc:C.green},
              {l:"ProverService",  v:"Aligned",       vc:C.green},
              {l:"Circuit Source", v:"Canonical",     vc:C.green},
              {l:"ZK Backend",     v:"Audit Pending", vc:C.orange},
              {l:"ED25519→EVM",    v:"Offchain Gate", vc:C.green},
            ]
          },
          {
            title:"GIT / BRANCH PROTOCOL",
            rows:[
              {l:"Production Branch",   v:"compliance-fabric", vc:C.green},
              {l:"Mirror Branch",       v:"main",              vc:C.t2},
              {l:"Branch Protection",   v:"ENFORCED",          vc:C.green},
              {l:"AGENTS.md Pre-flight",v:"ACTIVE",            vc:C.green},
              {l:"Commit Attestation",  v:"ON",                vc:C.green},
            ]
          },
          {
            title:"COMPLIANCE GATES",
            rows:[
              {l:"FSCA CASP Registration", v:"BLOCKING",    vc:C.red},
              {l:"FICA RMCP",              v:"BLOCKING",    vc:C.red},
              {l:"PAIA Manual",            v:"MISSING",     vc:C.red},
              {l:"POPIA §18",              v:"COMPLIANT",   vc:C.green},
              {l:"FSCA JS2 Target",        v:"Q3 2026",     vc:C.orange},
            ]
          },
        ].map(panel => (
          <div key={panel.title} style={{
            background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:16,
          }}>
            <div style={{fontFamily:MONO, fontSize:8.5, color:C.t3, letterSpacing:2, marginBottom:12}}>
              {panel.title}
            </div>
            {panel.rows.map(row => (
              <div key={row.l} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"5px 0", borderBottom:`1px solid ${C.border}`,
              }}>
                <span style={{fontFamily:MONO, fontSize:8.5, color:C.t2}}>{row.l}</span>
                <span style={{fontFamily:MONO, fontSize:8.5, color:row.vc}}>{row.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VVUGatewayOS() {
  const [auth, setAuth] = useState(false);
  const [view, setView] = useState("command");
  const [clock, setClock] = useState(new Date());
  const [cd, setCd] = useState(getCD());

  useEffect(() => {
    const t = setInterval(() => { setClock(new Date()); setCd(getCD()); }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!auth) return <PinScreen onAuth={() => setAuth(true)} />;

  const entity = ENTITIES.find(e => e.id === view);

  const content = () => {
    if (view === "command")  return <CommandView cd={cd} />;
    if (view === "gov")      return <GovernanceView />;
    if (view === "systems")  return <SystemsView />;
    if (entity)              return <EntityDetail e={entity} />;
    return <CommandView cd={cd} />;
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100vh", background:C.void,
      color:C.t1, fontFamily:BODY, overflow:"hidden",
    }}>
      <style>{GCSS}</style>
      <Header clock={clock} />
      <div style={{display:"flex", flex:1, overflow:"hidden"}}>
        <Sidebar active={view} set={setView} />
        <div style={{flex:1, overflow:"hidden"}}>
          {content()}
        </div>
      </div>
    </div>
  );
}
