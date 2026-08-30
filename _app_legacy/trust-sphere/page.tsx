'use client'

import { useEffect, useRef } from 'react'

export default function TrustSpherePage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.hasAttribute('data-vvu-sphere-init')) return
    containerRef.current.setAttribute('data-vvu-sphere-init', '1')

    const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const STATES = ['unknown', 'identity', 'contribution', 'receipt', 'hash', 'zk', 'trust'] as const
    type State = typeof STATES[number]
    const STATE_COLORS: Record<State, string> = {
      unknown: '#2a2d3a', identity: '#3d6bff', contribution: '#3dd6ff',
      receipt: '#3dffb0', hash: '#c9a84c', zk: '#b23dff', trust: '#ff2e5f'
    }
    const STATE_LABELS: Record<State, string> = {
      unknown: 'Unverified', identity: 'Identity Verified', contribution: 'Contribution Verified',
      receipt: 'Receipt Generated', hash: 'Hash Linked', zk: 'ZK Proof Generated', trust: 'Trust Increased'
    }

    const stage = containerRef.current
    let W: number, H: number, DPR: number

    function resize() {
      DPR = window.devicePixelRatio || 1
      W = stage.clientWidth
      H = stage.clientHeight
      canvas.width = W * DPR
      canvas.height = H * DPR
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    window.addEventListener('resize', resize)

    interface Point {
      x: number; y: number; z: number
      state: State; stateT: number
      isSelf: boolean; ripple: number
      _jit?: number; _sx?: number; _sy?: number; _r?: number
    }

    const N = 420
    function fibonacciSphere(n: number): Point[] {
      const pts: Point[] = []
      const golden = Math.PI * (3 - Math.sqrt(5))
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2
        const r = Math.sqrt(1 - y * y)
        const theta = golden * i
        pts.push({
          x: Math.cos(theta) * r, y, z: Math.sin(theta) * r,
          state: 'unknown', stateT: Math.random() * 8000,
          isSelf: false, ripple: 0
        })
      }
      return pts
    }

    const points = fibonacciSphere(N)
    points[7].isSelf = true
    points[7].state = 'trust'

    const STATE_DURATION = 3200
    let rotY = 0, rotX = 0
    const angVelY = 0.00028, angVelX = 0.00011
    let hoverPoint: { sx: number; sy: number; p: Point } | null = null
    let mode = 'global'

    const tooltip = containerRef.current.querySelector('#tooltip') as HTMLDivElement
    const mCount = containerRef.current.querySelector('#mCount') as HTMLSpanElement
    const mDensity = containerRef.current.querySelector('#mDensity') as HTMLSpanElement
    const mQuestion = containerRef.current.querySelector('#mQuestion') as HTMLDivElement
    const btnGlobal = containerRef.current.querySelector('#btnGlobal') as HTMLButtonElement
    const btnPersonal = containerRef.current.querySelector('#btnPersonal') as HTMLButtonElement

    btnGlobal.onclick = () => {
      mode = 'global'
      btnGlobal.classList.add('active')
      btnPersonal.classList.remove('active')
      mQuestion.textContent = '"How healthy is the trust network right now?"'
    }
    btnPersonal.onclick = () => {
      mode = 'personal'
      btnPersonal.classList.add('active')
      btnGlobal.classList.remove('active')
      mQuestion.textContent = '"Where do I fit in the network?"'
    }

    function project(p: Point) {
      let x = p.x * Math.cos(rotY) - p.z * Math.sin(rotY)
      let z = p.x * Math.sin(rotY) + p.z * Math.cos(rotY)
      let y = p.y
      let y2 = y * Math.cos(rotX) - z * Math.sin(rotX)
      let z2 = y * Math.sin(rotX) + z * Math.cos(rotX)
      const scale = Math.min(W, H) * 0.34
      const persp = 2.6 / (2.6 + z2)
      return { sx: W / 2 + x * scale * persp, sy: H / 2 + y2 * scale * persp, depth: z2, persp }
    }

    interface ProjItem { p: Point; sx: number; sy: number; depth: number; persp: number; _sx?: number; _sy?: number; _r?: number }

    let lastTime = performance.now()
    let lastProj: ProjItem[] = []
    let raf: number

    function tick(now: number) {
      const dt = now - lastTime
      lastTime = now
      rotY += angVelY * dt
      rotX += angVelX * dt

      for (const p of points) {
        p.stateT += dt
        if (p.stateT > STATE_DURATION + (p._jit || (p._jit = Math.random() * 4000))) {
          const idx = STATES.indexOf(p.state)
          if (idx < STATES.length - 1) { p.state = STATES[idx + 1]; p.ripple = 1 }
          p.stateT = 0
        }
        if (p.ripple > 0) p.ripple = Math.max(0, p.ripple - dt / 900)
      }

      ctx.clearRect(0, 0, W, H)
      const proj: ProjItem[] = points.map(p => ({ p, ...project(p) }))
      proj.sort((a, b) => a.depth - b.depth)

      ctx.lineWidth = 0.5
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i]
        if (STATES.indexOf(a.p.state) < 2) continue
        for (let j = i + 1; j < Math.min(i + 6, proj.length); j++) {
          const b = proj[j]
          if (STATES.indexOf(b.p.state) < 2) continue
          const dx = a.sx - b.sx, dy = a.sy - b.sy
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 46) {
            const alpha = (1 - d / 46) * 0.12 * Math.min(a.persp, b.persp)
            ctx.strokeStyle = `rgba(201,168,76,${alpha})`
            ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
          }
        }
      }

      hoverPoint = null
      for (const item of proj) {
        const { p, sx, sy, persp } = item
        let r = 2.0 * persp + 0.6
        let color = STATE_COLORS[p.state]
        let alpha = 0.55 + 0.45 * persp

        if (mode === 'personal') {
          if (p.isSelf) { r *= 2.4; alpha = 1 }
          else { alpha *= 0.35 }
        }
        if (p.isSelf) color = '#ff2e5f'

        if (p.ripple > 0) {
          ctx.beginPath()
          ctx.arc(sx, sy, r + p.ripple * 10, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(201,168,76,${p.ripple * 0.5})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = alpha
        ctx.shadowColor = color
        ctx.shadowBlur = p.isSelf ? 14 : 4 * persp
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1

        item._sx = sx; item._sy = sy; item._r = Math.max(r, 4)
      }

      mCount.textContent = String(points.filter(p => STATES.indexOf(p.state) >= 1).length)
      mDensity.textContent = (points.filter(p => STATES.indexOf(p.state) >= 4).length / points.length * 100).toFixed(1) + '%'
      lastProj = proj
      raf = requestAnimationFrame(tick)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      let found: ProjItem | null = null, bestD = 12
      for (const item of lastProj) {
        if (item._sx == null || item._sy == null) continue
        const d = Math.hypot(item._sx - mx, item._sy - my)
        if (d < bestD) { bestD = d; found = item }
      }
      if (found) {
        tooltip.style.opacity = '1'
        tooltip.style.left = (mx + 16) + 'px'
        tooltip.style.top = (my + 16) + 'px'
        tooltip.innerHTML = `<b>${found.p.isSelf ? 'Your Identity' : 'Node'}</b><br>State: ${STATE_LABELS[found.p.state]}`
      } else {
        tooltip.style.opacity = '0'
      }
    }
    const onMouseLeave = () => { tooltip.style.opacity = '0' }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    resize()
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap');
        :root{
          --void:#09090f;--void-2:#0f0f18;--crimson:#C41E3A;--gold:#C9A84C;--unknown:#2a2d3a;
          --identity:#3d6bff;--contribution:#3dd6ff;--receipt:#3dffb0;--hash:#c9a84c;
          --zk:#b23dff;--trust:#ff2e5f;--text:#e8e6e0;--dim:#7b7d8c;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:radial-gradient(ellipse at 50% 30%,var(--void-2),var(--void) 70%);color:var(--text);font-family:'DM Sans',sans-serif;height:100%;overflow:hidden;}
        .sphere-wrap{position:relative;width:100%;height:100vh;display:flex;flex-direction:column;}
        .sphere-header{padding:22px 28px 8px;display:flex;justify-content:space-between;align-items:flex-start;z-index:5;}
        .sphere-header h1{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;letter-spacing:0.02em;color:var(--text);}
        .sphere-header h1 span{color:var(--gold);}
        .sphere-subtitle{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim);margin-top:4px;letter-spacing:0.02em;}
        .sphere-stage{position:relative;flex:1;min-height:0;}
        .sphere-stage canvas{position:absolute;inset:0;width:100%;height:100%;}
        .sphere-legend{position:absolute;top:22px;right:28px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--dim);background:rgba(9,9,15,0.55);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 16px;backdrop-filter:blur(6px);min-width:200px;z-index:5;}
        .sphere-legend .title{color:var(--text);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;margin-bottom:10px;letter-spacing:0.04em;text-transform:uppercase;}
        .lg-row{display:flex;align-items:center;gap:8px;margin:6px 0;}
        .lg-dot{width:8px;height:8px;border-radius:50%;flex:none;}
        .sphere-footer{padding:14px 28px 20px;display:flex;justify-content:space-between;align-items:center;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--dim);z-index:5;}
        .sphere-footer .metric{color:var(--gold);}
        .sphere-tooltip{position:absolute;pointer-events:none;font-family:'IBM Plex Mono',monospace;font-size:11px;background:rgba(9,9,15,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:8px 10px;color:var(--text);opacity:0;transition:opacity 0.15s;z-index:10;line-height:1.5;max-width:220px;}
        .sphere-controls{position:absolute;bottom:20px;left:28px;z-index:5;display:flex;gap:8px;}
        .sphere-controls button{font-family:'IBM Plex Mono',monospace;font-size:10.5px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--dim);padding:7px 12px;border-radius:6px;cursor:pointer;transition:all 0.15s;}
        .sphere-controls button:hover{color:var(--text);border-color:var(--gold);}
        .sphere-controls button.active{color:var(--gold);border-color:var(--gold);background:rgba(201,168,76,0.08);}
      `}</style>
      <div ref={containerRef} className="sphere-wrap">
        <header className="sphere-header">
          <div>
            <h1>Trust <span>Sphere</span></h1>
            <div className="sphere-subtitle">VVU TRUST RUNTIME · LIVE VERIFICATION STATE SPACE</div>
          </div>
        </header>
        <div className="sphere-stage">
          <canvas />
          <div className="sphere-legend">
            <div className="title">Node State</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--unknown)' }} />Unknown</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--identity)' }} />Identity Verified</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--contribution)' }} />Contribution Verified</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--receipt)' }} />Receipt Generated</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--hash)' }} />Hash Linked</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--zk)' }} />ZK Proof Generated</div>
            <div className="lg-row"><span className="lg-dot" style={{ background: 'var(--trust)' }} />Trust Increased</div>
          </div>
          <div className="sphere-tooltip" id="tooltip" />
          <div className="sphere-controls">
            <button id="btnGlobal" className="active">Global View</button>
            <button id="btnPersonal">Personal View</button>
          </div>
        </div>
        <div className="sphere-footer">
          <div>Verified identities: <span className="metric" id="mCount">—</span></div>
          <div>Trust density: <span className="metric" id="mDensity">—</span></div>
          <div id="mQuestion">"How healthy is the trust network right now?"</div>
        </div>
      </div>
    </>
  )
}
