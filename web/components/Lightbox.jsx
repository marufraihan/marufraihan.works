'use client'
import {useEffect, useRef, useState} from 'react'
import {lockScroll} from '@/lib/lock'
import {push, onPop} from '@/lib/hist'

// Click any photo on a project (or journal post) to see it full-screen.
// Arrow keys / swipe to move, tap or click to zoom, pinch on touch, Esc or swipe down to close.
const SEL = '.hero-img img, .xhero > img, .pt-img img, .seq img'
const ZOOM = 2.5

function pick(img) {
  const cands = [...(img.getAttribute('srcset') || '').matchAll(/(\S+)\s+(\d+)w/g)].map((m) => ({u: m[1], w: +m[2]})).sort((a, b) => a.w - b.w)
  const need = Math.min(2200, window.innerWidth * (window.devicePixelRatio || 1) * 1.4)
  const lo = img.currentSrc || img.src
  const hi = cands.length ? (cands.find((c) => c.w >= need) || cands[cands.length - 1]).u : lo
  const cap = img.closest('figure')?.querySelector('figcaption')?.textContent || ''
  return {lo, hi, alt: img.alt || '', caption: cap.trim()}
}

export default function Lightbox() {
  const [lb, setLb] = useState(null) // {items, i}
  const [zoomed, setZoomed] = useState(false)
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const panRef = useRef(null)
  const lbRef = useRef(null)
  lbRef.current = lb
  const g = useRef({ptrs: new Map(), s: 1, x: 0, y: 0, one: null, pinch: null})

  const n = lb ? lb.items.length : 0
  const cur = lb ? lb.items[lb.i] : null

  /* open */
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const t = e.target
      if (!(t instanceof Element) || t.closest('a, button')) return
      const zone = t.closest('.hero-img, .xhero, .pt-img, .seq')
      if (!zone) return
      const scope = t.closest('.ov-body, main') || document
      const imgs = [...scope.querySelectorAll(SEL)]
      const el = t.tagName === 'IMG' && imgs.includes(t) ? t : zone.matches('.xhero') ? zone.querySelector(':scope > img') : null
      const i = el ? imgs.indexOf(el) : -1
      if (i < 0) return
      push({mrw: 'lb'}, window.location.href)
      setLb({items: imgs.map(pick), i})
    }
    document.addEventListener('click', onClick)
    const off = onPop((e) => {
      if (lbRef.current && !(e.state && e.state.mrw === 'lb')) setLb(null)
    })
    return () => {
      document.removeEventListener('click', onClick)
      off()
    }
  }, [])

  const isOpen = !!lb
  useEffect(() => {
    if (!isOpen) return
    const unlock = lockScroll()
    const prev = document.activeElement
    rootRef.current?.focus({preventScroll: true})
    return () => {
      unlock()
      if (prev && prev.focus) prev.focus({preventScroll: true})
      setZoomed(false)
    }
  }, [isOpen])

  const close = () => (window.history.state && window.history.state.mrw === 'lb' ? window.history.back() : setLb(null))
  const go = (d) => setLb((l) => (l ? {...l, i: (l.i + d + l.items.length) % l.items.length} : l))

  /* a new picture always starts unzoomed; warm up its neighbours */
  useEffect(() => {
    if (!lb) return
    const s = g.current
    s.s = 1
    s.x = 0
    s.y = 0
    s.ptrs.clear()
    s.one = s.pinch = null
    setZoomed(false)
    ;[1, -1].forEach((d) => {
      const it = lb.items[(lb.i + d + lb.items.length) % lb.items.length]
      if (it) new Image().src = it.hi
    })
  }, [lb && lb.i, isOpen]) // eslint-disable-line

  /* keyboard */
  useEffect(() => {
    if (!isOpen) return
    const k = (e) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab') {
        const f = [...rootRef.current.querySelectorAll('button')]
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) (e.preventDefault(), last.focus())
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [isOpen]) // eslint-disable-line

  /* zoom and pan */
  const setT = (s, x, y, ease) => {
    const el = panRef.current
    const st = g.current
    st.s = s
    st.x = x
    st.y = y
    if (!el) return
    el.style.transition = ease ? 'transform .3s cubic-bezier(.2,.7,.2,1)' : 'none'
    el.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`
  }
  const dims = () => {
    const r = stageRef.current.getBoundingClientRect()
    const im = panRef.current.querySelector('.hi.ok') || panRef.current.querySelector('.lo')
    const ratio = im && im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : r.width / r.height
    const dw = Math.min(r.width, r.height * ratio)
    return {W: r.width, H: r.height, dw, dh: dw / ratio, cx: r.left + r.width / 2, cy: r.top + r.height / 2}
  }
  const clamp = (s, x, y) => {
    const d = dims()
    const mx = Math.max(0, (d.dw * s - d.W) / 2)
    const my = Math.max(0, (d.dh * s - d.H) / 2)
    return [Math.min(mx, Math.max(-mx, x)), Math.min(my, Math.max(-my, y))]
  }
  const zoomAt = (px, py) => {
    const d = dims()
    const [x, y] = clamp(ZOOM, (d.cx - px) * (ZOOM - 1), (d.cy - py) * (ZOOM - 1))
    setT(ZOOM, x, y, true)
    setZoomed(true)
  }
  const unzoom = () => {
    setT(1, 0, 0, true)
    setZoomed(false)
  }

  const down = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const s = g.current
    e.currentTarget.setPointerCapture(e.pointerId)
    s.ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY})
    if (s.ptrs.size === 1) s.one = {x0: e.clientX, y0: e.clientY, tx: s.x, ty: s.y, t: performance.now(), moved: false, dx: 0, dy: 0}
    if (s.ptrs.size === 2) {
      const [a, b] = [...s.ptrs.values()]
      s.pinch = {d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: s.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, tx: s.x, ty: s.y}
      s.one = null
    }
  }
  const move = (e) => {
    const s = g.current
    const p = s.ptrs.get(e.pointerId)
    if (!p) return
    p.x = e.clientX
    p.y = e.clientY
    if (s.ptrs.size === 2 && s.pinch) {
      const [a, b] = [...s.ptrs.values()]
      const k = Math.min(5, Math.max(1, (s.pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / s.pinch.d))
      const [x, y] = clamp(k, s.pinch.tx + ((a.x + b.x) / 2 - s.pinch.mx), s.pinch.ty + ((a.y + b.y) / 2 - s.pinch.my))
      setT(k, x, y)
      return
    }
    const o = s.one
    if (!o) return
    o.dx = e.clientX - o.x0
    o.dy = e.clientY - o.y0
    if (Math.abs(o.dx) > 6 || Math.abs(o.dy) > 6) o.moved = true
    if (s.s > 1) {
      const [x, y] = clamp(s.s, o.tx + o.dx, o.ty + o.dy)
      setT(s.s, x, y)
    } else if (o.moved) {
      if (Math.abs(o.dx) > Math.abs(o.dy)) setT(1, o.dx, 0)
      else setT(1, 0, Math.max(0, o.dy))
    }
  }
  const up = (e) => {
    const s = g.current
    if (!s.ptrs.delete(e.pointerId)) return
    if (s.pinch) {
      if (s.ptrs.size < 2) {
        s.pinch = null
        s.one = null
        s.s < 1.05 ? unzoom() : setZoomed(true)
      }
      return
    }
    const o = s.one
    s.one = null
    if (!o) return
    const quick = performance.now() - o.t < 400
    if (s.s > 1) {
      if (!o.moved && quick) unzoom()
      return
    }
    if (!o.moved) {
      if (quick) zoomAt(e.clientX, e.clientY)
      return
    }
    if (Math.abs(o.dx) > 60 && Math.abs(o.dx) > Math.abs(o.dy)) {
      setT(1, 0, 0)
      go(o.dx < 0 ? 1 : -1)
    } else if (o.dy > 90 && o.dy > Math.abs(o.dx)) close()
    else setT(1, 0, 0, true)
  }
  const cancel = (e) => {
    g.current.ptrs.delete(e.pointerId)
    g.current.one = g.current.pinch = null
    if (g.current.s === 1) setT(1, 0, 0, true)
  }

  if (!lb || !cur) return null
  return (
    <div className="lb" ref={rootRef} role="dialog" aria-modal="true" aria-label="Image viewer" tabIndex={-1}>
      <div className="lb-top">
        <span className="small lb-count" aria-live="polite">
          {lb.i + 1} / {n}
        </span>
        <button type="button" className="txtbtn" onClick={close}>
          Close
        </button>
      </div>
      <div ref={stageRef} className={`lb-stage${zoomed ? ' zoomed' : ''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
        <div className="lb-pan" ref={panRef} key={cur.hi}>
          <img className="lb-img lo" src={cur.lo} alt="" draggable={false} />
          <img className="lb-img hi" src={cur.hi} alt={cur.alt} draggable={false} onLoad={(e) => e.currentTarget.classList.add('ok')} />
        </div>
      </div>
      <div className="lb-bot">
        {n > 1 ? (
          <button type="button" className="txtbtn" onClick={() => go(-1)} aria-label="Previous image">
            Prev
          </button>
        ) : (
          <span />
        )}
        <p className="small lb-cap">{cur.caption}</p>
        {n > 1 ? (
          <button type="button" className="txtbtn" onClick={() => go(1)} aria-label="Next image">
            Next
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
