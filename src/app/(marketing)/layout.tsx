const styles = {
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 90,
    background: 'rgba(250,250,247,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--card-border)',
    padding: '0 40px',
    height: '64px',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: '10px',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 800,
    fontSize: '18px',
    letterSpacing: '-0.02em',
    textDecoration: 'none',
    color: 'var(--ink)',
  },
  navLogoMark: {
    width: '32px',
    height: '32px',
    background: 'var(--ink)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    color: 'var(--amber)',
    fontSize: '14px',
    fontWeight: 800,
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: '32px',
    listStyle: 'none' as const,
  },
  navLink: {
    fontSize: '13.5px',
    fontWeight: 400,
    color: 'var(--ink)',
    textDecoration: 'none',
    opacity: 0.65,
    transition: 'opacity 0.2s',
    letterSpacing: '0.01em',
  },
  navCta: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: '12px',
  },
  btnPrimary: {
    background: 'var(--ink)',
    color: 'var(--amber)',
    fontFamily: 'DM Mono, monospace',
    fontSize: '12px',
    fontWeight: 500,
    padding: '10px 20px',
    borderRadius: '6px',
    textDecoration: 'none',
    letterSpacing: '0.04em',
    border: 'none',
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    color: 'var(--ink)',
    fontSize: '13.5px',
    fontWeight: 400,
    padding: '10px 16px',
    textDecoration: 'none',
    borderRadius: '6px',
    opacity: 0.65,
  },
  footer: {
    background: 'var(--ink)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '60px 40px 32px',
  },
  footerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '48px',
    paddingBottom: '48px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '32px',
  },
  footerBrandName: {
    fontFamily: 'Syne, sans-serif',
    fontSize: '16px',
    fontWeight: 800,
    color: 'white',
    marginBottom: '16px',
  },
  footerTagline: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: '1.6',
    maxWidth: '280px',
  },
  footerColTitle: {
    fontFamily: 'Syne, sans-serif',
    fontSize: '13px',
    fontWeight: 700,
    color: 'white',
    marginBottom: '16px',
  },
  footerLink: {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    textDecoration: 'none',
    marginBottom: '10px',
  },
  footerBottom: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  footerCopy: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'DM Mono, monospace',
  },
};

const linkHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
    (e.target as HTMLAnchorElement).style.opacity = '1';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
    (e.target as HTMLAnchorElement).style.opacity = '0.65';
  },
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={styles.navLink}
      onMouseEnter={linkHover.onMouseEnter}
      onMouseLeave={linkHover.onMouseLeave}
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <div style={styles.footerGrid}>
          <div>
            <div style={styles.footerBrandName}>Ubuntu Pools</div>
            <p style={styles.footerTagline}>
              Collective prosperity, cryptographically secured. A Vaguely Vanity LLC product built on Ubuntu philosophy.
            </p>
          </div>
          <div>
            <div style={styles.footerColTitle}>Product</div>
            <a href="/ubuntu-pools" style={styles.footerLink}>Ubuntu Pools</a>
            <a href="/about" style={styles.footerLink}>How it works</a>
            <a href="/about" style={styles.footerLink}>Ubuntu Score</a>
            <a href="/about" style={styles.footerLink}>ProofBridge</a>
          </div>
          <div>
            <div style={styles.footerColTitle}>Company</div>
            <a href="/about" style={styles.footerLink}>About VVU</a>
            <a href="/faqs" style={styles.footerLink}>FAQs</a>
            <a href="/dashboard" style={styles.footerLink}>Dashboard</a>
          </div>
          <div>
            <div style={styles.footerColTitle}>Legal</div>
            <a href="/faqs" style={styles.footerLink}>POPIA Policy</a>
            <a href="/faqs" style={styles.footerLink}>Terms of Service</a>
            <a href="/faqs" style={styles.footerLink}>Contact</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span style={styles.footerCopy}>
            © 2026 Vaguely Vanity LLC · Gqeberha, Eastern Cape
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/faqs" style={styles.footerCopy}>Privacy</a>
            <a href="/faqs" style={styles.footerCopy}>Terms</a>
            <a href="/faqs" style={styles.footerCopy}>POPIA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={styles.nav}>
        <a href="/" style={styles.navLogo}>
          <div style={styles.navLogoMark}>U</div>
          Ubuntu Pools
        </a>
        <ul style={styles.navLinks}>
          <li><NavLink href="/#how-it-works">How it works</NavLink></li>
          <li><NavLink href="/#pool-types">Pool types</NavLink></li>
          <li><NavLink href="/#ubuntu-score">Ubuntu Score</NavLink></li>
          <li><NavLink href="/#integrations">Integrations</NavLink></li>
          <li><NavLink href="/about">About</NavLink></li>
          <li><NavLink href="/faqs">FAQs</NavLink></li>
        </ul>
        <div style={styles.navCta}>
          <a href="/dashboard" style={styles.btnGhost}>Sign in</a>
          <a href="/dashboard" style={styles.btnPrimary}>Start a pool →</a>
        </div>
      </nav>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
