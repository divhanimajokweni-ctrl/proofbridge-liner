'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface BrandArchitectureModalProps {
  open: boolean
  onClose: () => void
}

type BrandEntity = {
  name: string
  color: string
  hierarchy: string
  independence: string
  coBranding: string
  visualTreatment: string
}

const BRANDS: BrandEntity[] = [
  {
    name: 'VVU Trust Runtime',
    color: '#C8A84A',
    hierarchy: 'Parent',
    independence: '—',
    coBranding: 'Solo mark',
    visualTreatment: 'Triple ring + wordmark',
  },
  {
    name: 'Ubuntu Pools',
    color: '#3ECF8E',
    hierarchy: 'Sub-brand',
    independence: 'High',
    coBranding: 'Independent mark OK',
    visualTreatment: 'Triangle mark + own name',
  },
  {
    name: 'ProofBridge',
    color: '#00E5FF',
    hierarchy: 'Sub-brand',
    independence: 'Medium',
    coBranding: 'VVU + own mark',
    visualTreatment: 'Anchor mark + "by VVU"',
  },
  {
    name: 'AIR Kernel',
    color: '#C4254F',
    hierarchy: 'Engine',
    independence: 'Low',
    coBranding: 'Always VVU-branded',
    visualTreatment: 'Badge mark + VVU prefix',
  },
  {
    name: 'SafeKrypte',
    color: '#8B5DE5',
    hierarchy: 'Engine',
    independence: 'Low',
    coBranding: 'Always VVU-branded',
    visualTreatment: 'Shield mark + VVU prefix',
  },
  {
    name: 'SafeLiner',
    color: '#4A9EE8',
    hierarchy: 'Engine',
    independence: 'Low',
    coBranding: 'Always VVU-branded',
    visualTreatment: 'Array mark + VVU prefix',
  },
]

const GUIDELINES = [
  'Always use the parent mark on Engine Primitives',
  'Sub-brands may use independent marks with "by VVU" attribution',
  'No entity may use the VVU mark without parent authorization',
  'Color tokens must match the assigned palette',
]

const independenceColor: Record<string, string> = {
  High: 'var(--color-green)',
  Medium: 'var(--color-gold)',
  Low: 'var(--color-crimson-bright)',
}

const independenceBg: Record<string, string> = {
  High: 'var(--color-green-dim)',
  Medium: 'var(--color-gold-dim)',
  Low: 'var(--color-crimson-dim)',
}

const hierarchyNodes = [
  { name: 'VVU Trust Runtime', color: '#C8A84A', role: 'Parent', y: 0 },
  { name: 'Ubuntu Pools', color: '#3ECF8E', role: 'Sub-brand', y: 1 },
  { name: 'ProofBridge', color: '#00E5FF', role: 'Sub-brand', y: 1 },
  { name: 'AIR Kernel', color: '#C4254F', role: 'Engine', y: 2 },
  { name: 'SafeKrypte', color: '#8B5DE5', role: 'Engine', y: 2 },
  { name: 'SafeLiner', color: '#4A9EE8', role: 'Engine', y: 2 },
]

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1.5fr 2fr',
  alignItems: 'center',
  padding: '10px 16px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '0.72rem',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
}

const rowHeadStyle: React.CSSProperties = {
  ...rowStyle,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  background: 'var(--color-card)',
}

export default function BrandArchitectureModal({ open, onClose }: BrandArchitectureModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return

    previousFocus.current = document.activeElement as HTMLElement

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'Tab') {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => {
      panelRef.current?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      previousFocus.current?.focus()
    }
  }, [open, handleClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="brand-arch-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === overlayRef.current) handleClose()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(7, 9, 12, 0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '24px',
          }}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              overflow: 'auto',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
            className="vvu-scroll"
          >
            <button
              onClick={handleClose}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                lineHeight: 1,
                zIndex: 1,
                transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gold-border)'
                e.currentTarget.style.color = 'var(--color-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              ✕
            </button>

            <div style={{ padding: '28px 32px 24px' }}>
              <div style={{ marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold)',
                  }}
                >
                  Venture Vision Ubuntu
                </span>
              </div>
              <h2
                id="brand-arch-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text-primary)',
                  margin: '0 0 28px',
                }}
              >
                Brand Architecture
              </h2>

              <section style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    marginBottom: '16px',
                  }}
                >
                  Hierarchy
                </div>
                <HierarchyTree />
              </section>

              <section style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  Compliance Matrix
                </div>
                <div
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div className="matrix-scroll">
                    <div style={rowHeadStyle}>
                      <span>Entity</span>
                      <span>Hierarchy</span>
                      <span>Independence</span>
                      <span>Co-branding</span>
                      <span>Visual Identity</span>
                    </div>
                    {BRANDS.map((brand) => (
                      <div key={brand.name} style={rowStyle}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--color-text-primary)',
                            fontWeight: 500,
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: brand.color,
                              flexShrink: 0,
                            }}
                          />
                          {brand.name}
                        </span>
                        <span>{brand.hierarchy}</span>
                        <span>
                          {brand.independence !== '—' ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                background: independenceBg[brand.independence] || 'transparent',
                                color: independenceColor[brand.independence] || 'var(--color-text-secondary)',
                                border: `1px solid ${independenceColor[brand.independence] || 'var(--color-border)'}22`,
                              }}
                            >
                              {brand.independence}
                            </span>
                          ) : (
                            '—'
                          )}
                        </span>
                        <span>{brand.coBranding}</span>
                        <span>{brand.visualTreatment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  Guidelines
                </div>
                <div
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderLeft: '3px solid var(--color-gold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px 20px',
                  }}
                >
                  {GUIDELINES.map((g) => (
                    <div
                      key={g}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '6px 0',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.55,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--color-gold)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          marginTop: '1px',
                          flexShrink: 0,
                        }}
                      >
                        →
                      </span>
                      {g}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>

          <style>{`
            .matrix-scroll {
              overflow-x: auto;
            }
            @media (max-width: 640px) {
              .matrix-scroll > div {
                grid-template-columns: 1fr 1fr !important;
              }
              .matrix-scroll > div > span:nth-child(4),
              .matrix-scroll > div > span:nth-child(5) {
                display: none;
              }
              .matrix-scroll > div > span:nth-child(1) {
                grid-column: 1 / -1;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HierarchyTree() {
  const levels = [
    { label: 'Parent', brands: [hierarchyNodes[0]] },
    { label: 'Sub-brands', brands: hierarchyNodes.filter((b) => b.y === 1) },
    { label: 'Engine Primitives', brands: hierarchyNodes.filter((b) => b.y === 2) },
  ]

  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0',
      }}
    >
      {levels.map((level, li) => (
        <div
          key={level.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {li > 0 && (
            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--color-border)',
              }}
            />
          )}
          {li > 0 && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '8px',
              }}
            >
              {level.label}
            </div>
          )}
          {li === 0 && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '10px',
              }}
            >
              {level.label}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {level.brands.map((b, bi) => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center' }}>
                {li > 0 && bi === 0 && (
                  <div
                    style={{
                      width: '16px',
                      height: '1px',
                      background: 'var(--color-border)',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: 'var(--color-surface)',
                    border: `1px solid ${b.color}22`,
                    borderRadius: 'var(--radius-xs)',
                    transition: 'border-color var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${b.color}66`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${b.color}22`
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: b.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.5rem',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: `${b.color}12`,
                      color: b.color,
                      border: `1px solid ${b.color}28`,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.role}
                  </span>
                </div>
                {li > 0 && bi < level.brands.length - 1 && (
                  <div
                    style={{
                      width: '16px',
                      height: '1px',
                      background: 'var(--color-border)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {li < levels.length - 1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                marginTop: '0',
              }}
            >
              <div
                style={{
                  width: '1px',
                  height: '16px',
                  background: 'var(--color-border)',
                }}
              />
              <div
                style={{
                  width: `${Math.min(80, 30 + level.brands.length * 20)}%`,
                  height: '1px',
                  background: 'var(--color-border)',
                }}
              />
              <div style={{ display: 'flex', gap: '60px', marginTop: '-1px' }}>
                {level.brands.length > 1 &&
                  level.brands.map((b) => (
                    <div
                      key={b.name}
                      style={{
                        width: '1px',
                        height: '14px',
                        background: 'var(--color-border)',
                      }}
                    />
                  ))}
                {level.brands.length <= 1 && (
                  <div
                    style={{
                      width: '1px',
                      height: '14px',
                      background: 'var(--color-border)',
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
