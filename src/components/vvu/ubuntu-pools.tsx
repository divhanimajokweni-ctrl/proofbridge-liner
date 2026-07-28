"use client";

/**
 * Ubuntu Pools — Production Landing Page
 *
 * Ubuntu Pools is the primary product of the VVU stack. It is a community
 * savings circle (stokvel) where members contribute money, the system
 * proves every contribution is recorded honestly, every payout is
 * verifiable, and no one can quietly take more than they're owed.
 *
 * Every other component in the VVU stack (ProofBridge, AIR Runtime,
 * Epistemic Runtime, HBK) exists to make this cryptographically provable,
 * operationally observable, and independently auditable.
 *
 * Design: warm-white aesthetic (bone / amber / sage / rust), Syne display
 * font, DM Sans body, DM Mono for telemetry. Bento-grid layout with
 * live pool card, Ubuntu Score dial, ant telemetry ticker, and a contact
 * modal wired to /api/contact.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function UbuntuPools() {
  const [contactOpen, setContactOpen] = useState(false);
  const [velocity, setVelocity] = useState(842);
  const [contactStatus, setContactStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ant telemetry jitter
  useEffect(() => {
    const t = setInterval(() => {
      setVelocity((v) => {
        const jitter = Math.floor(Math.random() * 20) - 10;
        return Math.max(800, Math.min(900, v + jitter));
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Intersection observer for fade-in animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("up-visible");
          }
        });
      },
      { threshold: 0.2 },
    );
    document.querySelectorAll<HTMLElement>(".up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setContactStatus(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          message: fd.get("message"),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setContactStatus({ ok: true, msg: data.message || "Message sent. We'll be in touch." });
        form.reset();
      } else {
        setContactStatus({ ok: false, msg: data.error || "Failed to send. Try emailing us directly." });
      }
    } catch {
      setContactStatus({ ok: false, msg: "Network error. Please try again or email us directly." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="up-root">
      <style>{CSS}</style>

      {/* ═══ ANT TELEMETRY TICKER ═══ */}
      <div className="ant-ticker">
        <div className="ant-ticker-inner">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, i) => (
            <div key={i} className="ant-ticker-item">
              <span className="label">{item.label}</span>
              <span className={item.up ? "up" : ""}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <nav>
        <a href="/" className="nav-logo">
          <div className="nav-logo-mark">U</div>
          Ubuntu Pools
        </a>
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#pool-types">Pool types</a></li>
          <li><a href="#ubuntu-score">Ubuntu Score</a></li>
          <li><a href="#integrations">Integrations</a></li>
        </ul>
        <div className="nav-cta">
          <a href="#onboard" className="btn-ghost">Sign in</a>
          <a href="#onboard" className="btn-primary">Start a pool →</a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="dot" />
              Collective savings · Amoy testnet live
            </div>
            <h1 className="hero-headline">
              Saving together,<br />
              <span className="accent">proven</span> on-chain.<br />
              <span className="accent-sage">Ubuntu</span> made financial.
            </h1>
            <p className="hero-sub">
              Ubuntu Pools is a ROSCA-powered community savings platform. Every contribution is cryptographically receipted via ProofBridge, every payout is verified by your pool — no trust required.
            </p>
            <div className="hero-actions">
              <a href="#onboard" className="btn-hero-primary">Start your pool →</a>
              <a href="#how-it-works" className="btn-hero-secondary">See how it works</a>
            </div>
            <div className="hero-social-proof">
              <div className="hero-avatars">
                <div className="hero-avatar">T</div>
                <div className="hero-avatar" style={{ background: "var(--sage)", color: "white" }}>L</div>
                <div className="hero-avatar" style={{ background: "var(--amber)", color: "var(--ink)" }}>M</div>
                <div className="hero-avatar" style={{ background: "#444", color: "white" }}>+</div>
              </div>
              <p className="hero-social-text"><strong>342 members</strong> saving collectively across 8 active pools</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="pool-card">
              <div className="pool-card-header">
                <div className="pool-card-name">Pilot Cohort — Cycle 2</div>
                <div className="pool-card-status">● Active</div>
              </div>
              <div className="pool-card-amount">R 15,750</div>
              <div className="pool-card-label">COLLECTIVE_SAVINGS // FACILITATOR_APPROVED</div>
              <div className="pool-progress"><div className="pool-progress-fill" /></div>
              <div className="pool-members">
                <div className="pool-member-item">
                  <div className="pool-member-initial">T</div>
                  <div className="pool-member-detail">
                    <div className="pool-member-name" style={{ fontSize: 12 }}>Sawubona, Thabo</div>
                    <div className="pool-member-amount">R 500 / cycle</div>
                  </div>
                </div>
                <div className="pool-member-item">
                  <div className="pool-member-initial" style={{ background: "rgba(232,160,32,0.2)", color: "var(--amber)" }}>L</div>
                  <div className="pool-member-detail">
                    <div className="pool-member-name" style={{ fontSize: 12 }}>Lerato K.</div>
                    <div className="pool-member-amount">R 500 / cycle</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pool-mini-card">
              <div>
                <div className="pool-mini-label">UPCOMING PAYOUT</div>
                <div className="pool-mini-value">R 15,000</div>
              </div>
              <span className="pool-mini-badge badge-green">Facilitator approved</span>
            </div>
            <div className="pool-mini-card">
              <div>
                <div className="pool-mini-label">NETWORK VELOCITY</div>
                <div className="pool-mini-value">{velocity}</div>
              </div>
              <span className="pool-mini-badge badge-amber">Ubuntu Prime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ANT BANNER ═══ */}
      <div style={{ padding: "0 40px", maxWidth: 1280, margin: "0 auto 40px" }}>
        <div className="ant-banner">
          <div className="ant-banner-left">
            <div className="ant-banner-icon">📡</div>
            <div className="ant-banner-text">
              <strong>ANT Telemetry</strong> — real-time network health monitored across all pools. Anomaly pressure triggers kernel halt phrase automatically.
            </div>
          </div>
          <div className="ant-banner-metrics">
            <div className="ant-metric">
              <div className="ant-metric-value">99.8%</div>
              <div className="ant-metric-label">UPTIME</div>
            </div>
            <div className="ant-metric">
              <div className="ant-metric-value">0</div>
              <div className="ant-metric-label">ANOMALIES</div>
            </div>
            <div className="ant-metric">
              <div className="ant-metric-value">R 0</div>
              <div className="ant-metric-label">DISPUTED</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TRUST BAND ═══ */}
      <div className="trust-band">
        <div className="trust-band-inner">
          {TRUST_ITEMS.map((t, i) => (
            <div key={i} className="trust-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" dangerouslySetInnerHTML={{ __html: t.svg }} />
              <span dangerouslySetInnerHTML={{ __html: t.text }} />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="stat-band" style={{ marginTop: 80 }}>
        {STATS.map((s, i) => (
          <div key={i} className="stat-item">
            <div className="stat-number" dangerouslySetInnerHTML={{ __html: s.value }} />
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="section up" id="how-it-works">
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-title">Three steps to<br />collective wealth.</h2>
        <p className="section-sub">Ubuntu Pools combines ancient African savings wisdom with modern cryptographic proof. Your stokvel, made verifiable.</p>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-desc">{s.desc}</p>
              <span className={`step-tag ${s.tagClass}`}>{s.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ UBUNTU SCORE ═══ */}
      <section className="score-section up" id="ubuntu-score">
        <div className="score-inner">
          <div>
            <div className="section-eyebrow" style={{ color: "var(--amber)" }}>Ubuntu Score</div>
            <h2 className="section-title" style={{ color: "white" }}>Your reputation,<br />earned on-chain.</h2>
            <p className="section-sub" style={{ color: "rgba(255,255,255,0.5)" }}>
              The Ubuntu Score measures your reliability as a pool member — contribution consistency, governance participation, and network velocity. Higher scores unlock better pools and lower platform fees. A credit history that exists independent of any single bank's ledger — owned by the individual, provable by mathematics, and portable across institutions.
            </p>
            <div className="score-features">
              {SCORE_FEATURES.map((f, i) => (
                <div key={i} className="score-feature">
                  <div className="score-feature-icon">{f.icon}</div>
                  <div>
                    <div className="score-feature-title">{f.title}</div>
                    <p className="score-feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="score-dial-wrap">
            <div className="score-dial">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle cx="100" cy="100" r="88" fill="none" stroke="url(#scoreGrad)" strokeWidth="12"
                  strokeDasharray="553" strokeDashoffset="166" strokeLinecap="round"
                  transform="rotate(-90 100 100)" />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E8A020" />
                    <stop offset="100%" stopColor="#F2B84B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="score-dial-center">
                <div className="score-dial-number">842</div>
                <div className="score-dial-label">Ubuntu Score</div>
              </div>
            </div>
            <div className="score-tiers" style={{ width: 260 }}>
              {SCORE_TIERS.map((t, i) => (
                <div key={i} className={`score-tier ${t.active ? "active" : ""}`}>
                  <div className="score-tier-name">{t.name}</div>
                  <div className="score-tier-range">{t.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ POOL TYPES ═══ */}
      <section className="section up" id="pool-types">
        <div className="section-eyebrow">Pool types</div>
        <h2 className="section-title">Choose your<br />collective structure.</h2>
        <p className="section-sub">From traditional stokvels to investment circles, every pool structure is governed by the same cryptographic rails.</p>
        <div className="pool-types-grid">
          {POOL_TYPES.map((p, i) => (
            <div key={i} className={`pool-type-card ${p.featured ? "featured" : ""}`}>
              <span className="pool-type-emoji">{p.emoji}</span>
              <div className="pool-type-name">{p.name}</div>
              <p className="pool-type-desc">{p.desc}</p>
              <div className="pool-type-amount" style={p.featured ? { color: "var(--amber)" } : undefined}>{p.amount}</div>
              <div className="pool-type-meta" style={p.featured ? { color: "rgba(255,255,255,0.3)" } : undefined}>{p.meta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section className="integrations-section up" id="integrations">
        <div className="integrations-inner">
          <div className="section-eyebrow">Integrations</div>
          <h2 className="section-title">Built on infrastructure<br />you can verify.</h2>
          <p className="section-sub">Every component in the Ubuntu Pools stack is auditable, tested, and purpose-built — no black boxes. Ubuntu Pools is what all of these exist for.</p>
          <div className="integrations-grid">
            {INTEGRATIONS.map((it, i) => (
              <div key={i} className="integration-card">
                <div className="integration-logo" style={{ background: it.bg }}>{it.emoji}</div>
                <div className="integration-name">{it.name}</div>
                <p className="integration-desc">{it.desc}</p>
                <span className={`integration-status status-${it.status.toLowerCase()}`}>{it.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ONBOARDING ═══ */}
      <section className="onboard-section up" id="onboard">
        <div className="onboard-inner">
          <div className="section-eyebrow">Get started</div>
          <h2 className="section-title">Your pool starts here.</h2>
          <div className="onboard-cards">
            {ONBOARD.map((o, i) => (
              <div key={i} className="onboard-card">
                <div className="onboard-card-num">{o.num}</div>
                <div className="onboard-card-title">{o.title}</div>
                <p className="onboard-card-desc">{o.desc}</p>
                <a href="#onboard" className="onboard-card-action">{o.action} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT MODAL ═══ */}
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            className="contact-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setContactOpen(false); }}
          >
            <motion.div
              className="contact-modal"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <button className="contact-close" onClick={() => setContactOpen(false)}>×</button>
              <h3>Contact Ubuntu Pools</h3>
              <p>Send us a message — we'll respond within 24 hours.</p>
              <form onSubmit={handleContact}>
                <div className="form-group">
                  <label htmlFor="contactName">Name</label>
                  <input type="text" id="contactName" name="name" placeholder="Your name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail">Email</label>
                  <input type="email" id="contactEmail" name="email" placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="contactMsg">Message</label>
                  <textarea id="contactMsg" name="message" placeholder="How can we help?" required />
                </div>
                <button type="submit" className="btn-contact" disabled={submitting}>
                  {submitting ? "Sending…" : "Send message"}
                </button>
                {contactStatus && (
                  <div className={`contact-status ${contactStatus.ok ? "ok" : "err"}`}>{contactStatus.msg}</div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ COMPLIANCE BAND ═══ */}
      <div className="compliance-band">
        {COMPLIANCE.map((c, i) => (
          <div key={i} className="compliance-item">
            <span className={`dot-${c.color}`} />{c.text}
          </div>
        ))}
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <div className="nav-logo-mark">U</div>
                <span className="footer-brand-name">Ubuntu Pools</span>
              </div>
              <p className="footer-tagline">Collective prosperity, cryptographically secured. Ubuntu Pools is what all of this is for — a stokvel where every contribution is proven, every payout is verifiable, and no one can quietly take more than they're owed.</p>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Product</div>
              <a href="#how-it-works">How it works</a>
              <a href="#pool-types">Pool types</a>
              <a href="#ubuntu-score">Ubuntu Score</a>
              <a href="#onboard">Governance</a>
              <a href="#integrations">ProofBridge</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Integrations</div>
              <a href="#integrations">Stitch</a>
              <a href="#integrations">Gate-1</a>
              <a href="#integrations">SafeKrypte</a>
              <a href="#integrations">ANT Telemetry</a>
              <a href="#integrations">API Docs</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Legal</div>
              <a href="#onboard">POPIA Policy</a>
              <a href="#onboard">Terms of Service</a>
              <a href="#onboard">Data Retention</a>
              <a href="#onboard">FSCA Disclosure</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setContactOpen(true); }}>Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 Venture Vision Ubuntu · Gqeberha, Eastern Cape · ubuntu-pools.vercel.app</span>
            <div className="footer-legal">
              <a href="#onboard">Privacy</a>
              <a href="#onboard">Terms</a>
              <a href="#onboard">POPIA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { label: "NETWORK VELOCITY", value: "842", up: true },
  { label: "ACTIVE POOLS", value: "8", up: false },
  { label: "VAULTED", value: "R 127,500", up: true },
  { label: "VERIFIED TXS", value: "342", up: false },
  { label: "CYCLE 2 PAYOUT", value: "R 15,000", up: true },
  { label: "STITCH RAIL", value: "ONLINE", up: true },
  { label: "PROOFBRIDGE", value: "v2.1.0", up: true },
  { label: "AVG UBUNTU SCORE", value: "764", up: true },
  { label: "POPIA", value: "COMPLIANT", up: true },
  { label: "AMOY TESTNET", value: "LIVE", up: true },
];

const TRUST_ITEMS = [
  { svg: '<path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" stroke="#3D5A47" stroke-width="1.5" fill="none"/>', text: "<strong>ED25519</strong> cryptographic receipts on every transaction" },
  { svg: '<circle cx="8" cy="8" r="6.5" stroke="#3D5A47" stroke-width="1.5"/><path d="M5.5 8l2 2 3-3" stroke="#3D5A47" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', text: "<strong>Stitch</strong> instant bank-grade payment rails" },
  { svg: '<rect x="2" y="2" width="12" height="12" rx="2" stroke="#3D5A47" stroke-width="1.5" fill="none"/><path d="M5 8h6M8 5v6" stroke="#3D5A47" stroke-width="1.5" stroke-linecap="round"/>', text: "<strong>POPIA compliant</strong> data protection and retention" },
  { svg: '<path d="M8 2L3 5.5v3C3 11.4 5.2 14 8 14.5 10.8 14 13 11.4 13 8.5v-3L8 2z" stroke="#3D5A47" stroke-width="1.5" fill="none"/>', text: "<strong>ProofBridge</strong> every pool auditable on-chain" },
  { svg: '<circle cx="8" cy="5" r="2.5" stroke="#3D5A47" stroke-width="1.5" fill="none"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#3D5A47" stroke-width="1.5" stroke-linecap="round" fill="none"/>', text: "<strong>Gate-1</strong> evaluates flow before every payout" },
];

const STATS = [
  { value: 'R<span class="stat-accent">127</span>K', label: "Total vaulted" },
  { value: '<span class="stat-accent">8</span>', label: "Active pools" },
  { value: '<span class="stat-accent">342</span>', label: "Verified transactions" },
  { value: '<span class="stat-accent">0</span>', label: "Disputed payouts" },
];

const STEPS = [
  { num: "01", icon: "🏦", title: "Connect via Stitch", desc: "Link your South African bank account in under 60 seconds. Stitch handles instant EFT payments — no manual transfers, no delays.", tag: "Stitch / WEBHOOKS", tagClass: "tag-stitch" },
  { num: "02", icon: "🔐", title: "Receive cryptographic proof", desc: "Every contribution mints an ED25519-signed receipt via ProofBridge. Immutable proof that your money entered the pool — no intermediary required.", tag: "ED25519 / ON-CHAIN", tagClass: "tag-ed25519" },
  { num: "03", icon: "📡", title: "Pool broadcasts in real-time", desc: "Every pool event — contributions, votes, payouts — broadcasts live to all members via WebSocket. Nothing happens behind closed doors.", tag: "WEBSOCKET / LIVE", tagClass: "tag-ws" },
];

const SCORE_FEATURES = [
  { icon: "⚡", title: "Network Velocity", desc: "On-time contributions amplify your score. Late payments reduce it. Consistent velocity qualifies you for Ubuntu Prime tier." },
  { icon: "🗳", title: "Governance Participation", desc: "Vote on pool disputes, approve payouts, ratify new members. Active governance earns score multipliers." },
  { icon: "🌱", title: "Community Standing", desc: "Invite verified members, sponsor pool cohorts, earn recognition. Ubuntu scores are non-transferable and non-purchasable." },
];

const SCORE_TIERS = [
  { name: "Ubuntu Emerging", range: "0 – 400", active: false },
  { name: "Ubuntu Active", range: "401 – 650", active: false },
  { name: "Ubuntu Trusted", range: "651 – 799", active: false },
  { name: "Ubuntu Prime", range: "800 – 1000", active: true },
];

const POOL_TYPES = [
  { emoji: "🫱🏿‍🫲🏽", name: "Burial Society", desc: "Community support pools with fixed monthly contributions and mutual aid disbursement. Governed by unanimous consent.", amount: "R 500 / month", meta: "MIN STAKE · GATE-1 EVALUATED", featured: false },
  { emoji: "💰", name: "Savings Stokvel", desc: "Classic rotating payout model. Members contribute equally; one member receives the full pot each cycle, rotating until every member has been paid.", amount: "R 500 – R 5,000 / month", meta: "MOST POPULAR · PROOFBRIDGE RECEIPTED", featured: true },
  { emoji: "📈", name: "Investment Circle", desc: "Pool members vote on collective investment decisions. Returns distributed proportionally. Requires Ubuntu Trusted score or above.", amount: "R 1,000+ / month", meta: "UBUNTU TRUSTED+ · FSCA ALIGNED", featured: false },
];

const INTEGRATIONS = [
  { emoji: "🏦", name: "Stitch", desc: "Primary payment rail. Instant EFT with webhook reconciliation and signed receipts.", status: "Live", bg: "rgba(61,90,71,0.1)" },
  { emoji: "🔗", name: "ProofBridge", desc: "ED25519-signed on-chain receipts. Every contribution cryptographically proven on Polygon Amoy.", status: "Live", bg: "rgba(232,160,32,0.1)" },
  { emoji: "📡", name: "ANT Telemetry", desc: "Real-time network health monitoring. Anomaly pressure triggers kernel halt phrase automatically.", status: "Live", bg: "rgba(13,13,13,0.06)" },
  { emoji: "⚖️", name: "Gate-1", desc: "Flow evaluation layer. Reviews all payout requests before disbursement proceeds.", status: "Live", bg: "rgba(61,90,71,0.1)" },
  { emoji: "🔐", name: "SafeKrypte", desc: "HSM-backed key custody. Threshold escrow with 3-of-5 internal SSS for all pool signing operations.", status: "Beta", bg: "rgba(196,66,42,0.1)" },
  { emoji: "📋", name: "Governance Module", desc: "On-chain dispute resolution. Votes, veto gates, and member ratification with full audit trail.", status: "Live", bg: "rgba(13,13,13,0.06)" },
  { emoji: "🛡", name: "POPIA Layer", desc: "Data minimisation, retention schedules, and right-to-erasure for all member PII.", status: "Live", bg: "rgba(232,160,32,0.1)" },
  { emoji: "📊", name: "Ubuntu Score API", desc: "Open scoring API. Third-party applications can request verified Ubuntu Score assertions for members.", status: "Beta", bg: "rgba(61,90,71,0.1)" },
];

const ONBOARD = [
  { num: "01 / JOIN A POOL", title: "I want to join an existing pool", desc: "Browse active pools, verify a pool's ProofBridge record, and submit a membership request. Your Ubuntu Score is your application.", action: "Browse pools" },
  { num: "02 / CREATE A POOL", title: "I want to start a new pool", desc: "Set your pool structure, contribution amount, and payout cycle. Invite members via WhatsApp or share your pool link. First contribution activates ProofBridge.", action: "Create a pool" },
  { num: "03 / ENTERPRISE API", title: "I want to integrate Ubuntu Pools", desc: "B2B API access for financial institutions, co-operatives, and insurers. White-label pool infrastructure with full ProofBridge attestation.", action: "API documentation" },
];

const COMPLIANCE = [
  { color: "green", text: "POPIA JS2 Compliant" },
  { color: "amber", text: "Polygon Amoy Testnet" },
  { color: "green", text: "ED25519 Verified" },
  { color: "amber", text: "Stitch Payment Rail" },
  { color: "green", text: "Gate-1 Flow Evaluation" },
  { color: "amber", text: "ANT Telemetry Active" },
  { color: "green", text: "R 0 Disputed Payouts" },
];

// ── All CSS (ported from the uploaded HTML, production-grade) ─────
const CSS = `
:root {
  --ink: #0D0D0D;
  --bone: #F5F0E8;
  --warm-white: #FAFAF7;
  --amber: #E8A020;
  --amber-light: #F2B84B;
  --amber-muted: #C4892A;
  --sage: #3D5A47;
  --sage-light: #4E7260;
  --sage-muted: #2A3D31;
  --rust: #C4422A;
  --dust: #B8A898;
  --grid: rgba(13,13,13,0.06);
  --card-border: rgba(13,13,13,0.1);
  --card-bg: rgba(255,255,255,0.7);
}
.up-root { box-sizing: border-box; }
.up-root *, .up-root *::before, .up-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
.up-root { font-family: 'DM Sans', sans-serif; background: var(--warm-white); color: var(--ink); overflow-x: hidden; }

/* ANT TICKER */
.ant-ticker { background: var(--ink); color: var(--amber); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.05em; padding: 6px 0; overflow: hidden; position: relative; z-index: 100; }
.ant-ticker-inner { display: flex; gap: 48px; white-space: nowrap; animation: tickerScroll 30s linear infinite; }
.ant-ticker-item { display: flex; align-items: center; gap: 8px; }
.ant-ticker-item .up { color: #4CAF50; }
.ant-ticker-item .label { color: var(--dust); }
@keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* NAV */
nav { position: sticky; top: 0; z-index: 90; background: rgba(250,250,247,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--card-border); padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
.nav-logo { display: flex; align-items: center; gap: 10px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: -0.02em; text-decoration: none; color: var(--ink); }
.nav-logo-mark { width: 32px; height: 32px; background: var(--ink); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--amber); font-size: 14px; font-weight: 800; }
.nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
.nav-links a { font-size: 13.5px; font-weight: 400; color: var(--ink); text-decoration: none; opacity: 0.65; transition: opacity 0.2s; letter-spacing: 0.01em; }
.nav-links a:hover { opacity: 1; }
.nav-cta { display: flex; align-items: center; gap: 12px; }
.btn-ghost { font-size: 13.5px; color: var(--ink); text-decoration: none; opacity: 0.65; transition: opacity 0.2s; }
.btn-ghost:hover { opacity: 1; }
.btn-primary { background: var(--ink); color: white; padding: 9px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 500; text-decoration: none; transition: background 0.2s; }
.btn-primary:hover { background: var(--sage-muted); }

/* HERO */
.hero { display: grid; grid-template-columns: 1fr 1fr; padding: 60px 40px; min-height: 600px; align-items: center; gap: 60px; }
.hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sage); margin-bottom: 20px; }
.hero-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.hero-headline { font-family: 'Syne', sans-serif; font-size: clamp(40px, 5.5vw, 72px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.02; margin-bottom: 24px; color: var(--ink); }
.hero-headline .accent { color: var(--amber); }
.hero-headline .accent-sage { color: var(--sage); }
.hero-sub { font-size: 17px; font-weight: 300; line-height: 1.7; color: rgba(13,13,13,0.6); max-width: 480px; margin-bottom: 32px; }
.hero-actions { display: flex; gap: 12px; margin-bottom: 36px; }
.btn-hero-primary { background: var(--amber); color: white; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 500; text-decoration: none; transition: background 0.2s; }
.btn-hero-primary:hover { background: var(--amber-muted); }
.btn-hero-secondary { border: 1px solid var(--card-border); color: var(--ink); padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 500; text-decoration: none; transition: border-color 0.2s; }
.btn-hero-secondary:hover { border-color: var(--ink); }
.hero-social-proof { display: flex; align-items: center; gap: 14px; }
.hero-avatars { display: flex; }
.hero-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--sage); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; margin-left: -10px; border: 2px solid var(--warm-white); }
.hero-avatar:first-child { margin-left: 0; }
.hero-social-text { font-size: 13px; color: rgba(13,13,13,0.5); }
.hero-social-text strong { color: var(--ink); }

/* HERO VISUAL — POOL CARD */
.hero-visual { display: flex; flex-direction: column; gap: 16px; padding-left: 40px; }
.pool-card { background: white; border: 1px solid var(--card-border); border-radius: 20px; padding: 28px; box-shadow: 0 8px 32px rgba(13,13,13,0.06); }
.pool-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.pool-card-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
.pool-card-status { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--sage); }
.pool-card-amount { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 4px; }
.pool-card-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.05em; color: var(--dust); margin-bottom: 20px; }
.pool-progress { height: 4px; background: var(--grid); border-radius: 2px; margin-bottom: 20px; overflow: hidden; }
.pool-progress-fill { height: 100%; background: linear-gradient(90deg, var(--amber), var(--amber-light)); border-radius: 2px; width: 87%; animation: fillGrow 1.5s ease; }
@keyframes fillGrow { from { width: 0; } }
.pool-members { display: flex; flex-direction: column; gap: 12px; }
.pool-member-item { display: flex; align-items: center; gap: 12px; }
.pool-member-initial { width: 32px; height: 32px; border-radius: 8px; background: rgba(61,90,71,0.1); color: var(--sage); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
.pool-member-detail { flex: 1; }
.pool-member-name { font-size: 13px; font-weight: 500; }
.pool-member-amount { font-size: 11px; color: var(--dust); font-family: 'DM Mono', monospace; }
.pool-mini-card { background: white; border: 1px solid var(--card-border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
.pool-mini-label { font-size: 12px; color: rgba(13,13,13,0.45); margin-bottom: 4px; font-family: 'DM Mono', monospace; letter-spacing: 0.03em; }
.pool-mini-value { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--ink); }
.pool-mini-badge { font-size: 11px; font-family: 'DM Mono', monospace; padding: 4px 10px; border-radius: 20px; }
.badge-green { background: rgba(61,90,71,0.1); color: var(--sage); }
.badge-amber { background: rgba(232,160,32,0.1); color: var(--amber-muted); }

/* TRUST BAND */
.trust-band { background: var(--bone); border-top: 1px solid var(--card-border); border-bottom: 1px solid var(--card-border); padding: 20px 40px; }
.trust-band-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.trust-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(13,13,13,0.55); }
.trust-item svg { flex-shrink: 0; }
.trust-item strong { color: var(--ink); }

/* STAT BAND */
.stat-band { max-width: 1280px; margin: 80px auto; padding: 0 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--card-border); border: 1px solid var(--card-border); border-radius: 16px; overflow: hidden; }
.stat-item { background: var(--warm-white); padding: 36px 32px; text-align: center; }
.stat-number { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; letter-spacing: -0.04em; color: var(--ink); margin-bottom: 6px; }
.stat-number .stat-accent { color: var(--amber); }
.stat-label { font-size: 13px; color: rgba(13,13,13,0.45); font-weight: 400; }

/* SECTIONS */
.section { max-width: 1280px; margin: 0 auto; padding: 80px 40px; }
.section-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sage); margin-bottom: 16px; }
.section-title { font-family: 'Syne', sans-serif; font-size: clamp(32px, 4vw, 52px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 20px; color: var(--ink); }
.section-sub { font-size: 16px; font-weight: 300; line-height: 1.7; color: rgba(13,13,13,0.6); max-width: 560px; margin-bottom: 60px; }

/* STEPS */
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.step-card { background: white; border: 1px solid var(--card-border); border-radius: 16px; padding: 32px; position: relative; transition: transform 0.25s, box-shadow 0.25s; }
.step-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(13,13,13,0.08); }
.step-number { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; color: rgba(13,13,13,0.06); letter-spacing: -0.05em; position: absolute; top: 20px; right: 24px; }
.step-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--ink); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 22px; }
.step-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.01em; }
.step-desc { font-size: 14px; line-height: 1.65; color: rgba(13,13,13,0.55); }
.step-tag { display: inline-block; margin-top: 16px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; }
.tag-stitch { background: rgba(61,90,71,0.1); color: var(--sage); }
.tag-ed25519 { background: rgba(232,160,32,0.1); color: var(--amber-muted); }
.tag-ws { background: rgba(196,66,42,0.1); color: var(--rust); }

/* UBUNTU SCORE */
.score-section { background: var(--ink); padding: 80px 40px; }
.score-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.score-features { display: flex; flex-direction: column; gap: 24px; margin-top: 40px; }
.score-feature { display: flex; gap: 16px; align-items: flex-start; }
.score-feature-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(232,160,32,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.score-feature-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: white; margin-bottom: 4px; }
.score-feature-desc { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.5); }
.score-dial-wrap { display: flex; flex-direction: column; align-items: center; gap: 24px; }
.score-dial { width: 220px; height: 220px; position: relative; }
.score-dial svg { width: 100%; height: 100%; }
.score-dial-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.score-dial-number { font-family: 'Syne', sans-serif; font-size: 56px; font-weight: 800; color: white; letter-spacing: -0.04em; }
.score-dial-label { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--amber); letter-spacing: 0.08em; text-transform: uppercase; }
.score-tiers { width: 260px; display: flex; flex-direction: column; gap: 8px; }
.score-tier { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
.score-tier.active { background: rgba(232,160,32,0.15); border-color: rgba(232,160,32,0.3); }
.score-tier-name { font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500; }
.score-tier.active .score-tier-name { color: var(--amber-light); }
.score-tier-range { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.3); }

/* POOL TYPES */
.pool-types-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.pool-type-card { background: white; border: 1px solid var(--card-border); border-radius: 16px; padding: 32px; transition: transform 0.25s, box-shadow 0.25s; }
.pool-type-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(13,13,13,0.08); }
.pool-type-card.featured { background: var(--ink); border-color: var(--ink); }
.pool-type-emoji { font-size: 32px; display: block; margin-bottom: 16px; }
.pool-type-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 10px; color: var(--ink); }
.pool-type-card.featured .pool-type-name { color: white; }
.pool-type-desc { font-size: 14px; line-height: 1.65; color: rgba(13,13,13,0.55); margin-bottom: 20px; }
.pool-type-card.featured .pool-type-desc { color: rgba(255,255,255,0.5); }
.pool-type-amount { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
.pool-type-meta { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.06em; color: var(--dust); }

/* INTEGRATIONS */
.integrations-section { background: var(--bone); padding: 80px 40px; border-top: 1px solid var(--card-border); border-bottom: 1px solid var(--card-border); }
.integrations-inner { max-width: 1280px; margin: 0 auto; }
.integrations-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.integration-card { background: white; border: 1px solid var(--card-border); border-radius: 14px; padding: 24px; transition: transform 0.2s; }
.integration-card:hover { transform: translateY(-2px); }
.integration-logo { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 14px; }
.integration-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.integration-desc { font-size: 12.5px; line-height: 1.6; color: rgba(13,13,13,0.5); margin-bottom: 14px; }
.integration-status { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
.status-live { background: rgba(61,90,71,0.1); color: var(--sage); }
.status-beta { background: rgba(232,160,32,0.1); color: var(--amber-muted); }

/* ONBOARDING */
.onboard-section { max-width: 1280px; margin: 0 auto; padding: 80px 40px; }
.onboard-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.onboard-card { background: white; border: 1px solid var(--card-border); border-radius: 16px; padding: 32px; transition: transform 0.25s, box-shadow 0.25s; }
.onboard-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(13,13,13,0.08); }
.onboard-card-num { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--sage); margin-bottom: 16px; }
.onboard-card-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.01em; }
.onboard-card-desc { font-size: 14px; line-height: 1.65; color: rgba(13,13,13,0.55); margin-bottom: 20px; }
.onboard-card-action { font-size: 14px; font-weight: 500; color: var(--amber-muted); text-decoration: none; }
.onboard-card-action:hover { color: var(--amber); }

/* CONTACT MODAL */
.contact-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; }
.contact-modal { background: white; max-width: 460px; width: 90%; padding: 32px; position: relative; border-radius: 16px; }
.contact-modal h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.contact-modal p { font-size: 13px; color: var(--dust); margin-bottom: 20px; }
.contact-close { position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--dust); }
.contact-close:hover { color: var(--ink); }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dust); margin-bottom: 4px; }
.form-group input, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--card-border); font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); background: var(--warm-white); outline: none; border-radius: 6px; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--amber); }
.form-group textarea { resize: vertical; min-height: 80px; }
.btn-contact { width: 100%; padding: 12px; background: var(--amber); color: white; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s; border-radius: 6px; }
.btn-contact:hover { background: var(--amber-muted); }
.btn-contact:disabled { opacity: 0.5; cursor: not-allowed; }
.contact-status { font-size: 11px; margin-top: 8px; display: none; }
.contact-status.ok { color: var(--sage); display: block; }
.contact-status.err { color: var(--rust); display: block; }

/* COMPLIANCE BAND */
.compliance-band { background: var(--ink); padding: 16px 40px; display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; }
.compliance-item { display: flex; align-items: center; gap: 8px; font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.03em; }
.dot-green { width: 6px; height: 6px; border-radius: 50%; background: #4CAF50; }
.dot-amber { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); }

/* FOOTER */
footer { background: var(--ink); padding: 60px 40px 32px; }
.footer-inner { max-width: 1280px; margin: 0 auto; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
.footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.footer-brand-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: white; }
.footer-tagline { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6; max-width: 320px; }
.footer-col-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: white; margin-bottom: 16px; letter-spacing: 0.01em; }
.footer-col a { display: block; font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; cursor: pointer; }
.footer-col a:hover { color: var(--amber); }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
.footer-copy { font-size: 12px; color: rgba(255,255,255,0.25); font-family: 'DM Mono', monospace; }
.footer-legal { display: flex; gap: 24px; }
.footer-legal a { font-size: 12px; color: rgba(255,255,255,0.25); text-decoration: none; font-family: 'DM Mono', monospace; }
.footer-legal a:hover { color: rgba(255,255,255,0.5); }

/* FADE-IN ANIMATION */
.up { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.up.up-visible { opacity: 1; transform: translateY(0); }

/* RESPONSIVE */
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; padding: 48px 24px; min-height: auto; gap: 32px; }
  .hero-visual { padding-left: 0; }
  .steps-grid, .pool-types-grid, .onboard-cards { grid-template-columns: 1fr; }
  .stat-band { grid-template-columns: 1fr 1fr; }
  .integrations-grid { grid-template-columns: 1fr 1fr; }
  nav { padding: 0 24px; }
  .nav-links { display: none; }
  .score-inner { grid-template-columns: 1fr; gap: 40px; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .section { padding: 60px 24px; }
  .score-section { padding: 60px 24px; }
  .compliance-band { gap: 16px; padding: 16px 24px; }
}
@media (max-width: 600px) {
  .integrations-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; gap: 32px; }
  .stat-band { grid-template-columns: 1fr; }
}
`;
