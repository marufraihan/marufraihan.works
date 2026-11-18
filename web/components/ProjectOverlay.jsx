'use client'
import {useEffect, useRef, useState} from 'react'
import {flushSync} from 'react-dom'
import {Mark} from './Logo'
import {lockScroll} from '@/lib/lock'
import {push, replace, onPop} from '@/lib/hist'

// Clicking a project opens it over the page instead of loading a new one.
// The project's own page is fetched (it is already a finished static page) and shown in a layer;
// the address bar still shows /work/<slug>/, Back or Esc returns to where you were, and
// a link opened directly (or in a new tab) is simply the full page.
// Where the browser supports it, the thumbnail grows into the project's first photo.
const PROJECT = /^\/work\/([^/]+)\/$/
const cache = new Map()

function parse(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const main = doc.querySelector('main')
  if (!main) throw new Error('no project')
  return {title: doc.title, dark: !!main.closest('.dark'), html: main.innerHTML}
}
function load(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status))
          return r.text()
        })
        .then(parse)
        .catch((e) => {
          cache.delete(url)
          throw e
        }),
    )
  }
  return cache.get(url)
}

const norm = (p) => (p.endsWith('/') ? p : p + '/')
const canVT = () => typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
const visible = (r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth

// the element that grows into the project: the card's picture box (or the hover preview in the list)
function thumbOf(link) {
  const el = link.querySelector('.ph, .th')
  if (el && visible(el.getBoundingClientRect())) return el
  const pk = document.querySelector('.peek.on')
  return pk && visible(pk.getBoundingClientRect()) ? pk : null
}
function findHero(root) {
  const a = root && root.querySelector('.hero-img img')
  if (a) return a.closest('.hero-img')
  return root && root.querySelector('.xhero > img')
}
function cardFor(slug) {
  const href = `/work/${slug}/`
  const a = [...document.querySelectorAll('a[href^="/work/"]')].find((x) => x.getAttribute('href') === href && !x.closest('.ov'))
  const el = a && a.querySelector('.ph, .th')
  return el && visible(el.getBoundingClientRect()) ? el : null
}

export default function ProjectOverlay() {
  const [ov, setOv] = useState(null) // {slug,url,title,dark,html,key,enter,swap}
  const rootRef = useRef(null)
  const S = useRef({ov: null, n: 0, opener: null, title: '', unlock: null, hero: null})

  const commit = (next) => {
    S.current.ov = next
    flushSync(() => setOv(next))
  }

  async function show(url, {link, pop} = {}) {
    const s = S.current
    if (s.busy) return
    s.busy = true
    try {
      await open(url, {link, pop})
    } finally {
      s.busy = false
    }
  }

  async function open(url, {link, pop}) {
    const s = S.current
    let data
    try {
      data = await load(url)
    } catch {
      if (!pop) window.location.assign(url)
      return
    }
    const slug = PROJECT.exec(url)[1]
    const base = {slug, url, title: data.title, dark: data.dark, html: data.html}
    if (s.ov) {
      // already open: move to another project in the same layer
      if (!pop) replace({mrw: 'ov', slug}, url)
      commit({...base, key: ++s.n, swap: true})
      document.title = data.title
      if (rootRef.current) rootRef.current.scrollTop = 0
      return
    }
    s.opener = document.activeElement
    s.title = document.title
    s.scrollY = window.scrollY
    s.unlock = lockScroll()
    if (!pop) push({mrw: 'ov', slug}, url)
    const vt = canVT()
    const thumb = vt && !pop && link ? thumbOf(link) : null
    if (thumb) thumb.style.viewTransitionName = 'proj'
    const render = () => {
      commit({...base, key: ++s.n, enter: !vt})
      document.title = data.title
      window.dispatchEvent(new Event('mrw:open'))
      const hero = thumb ? findHero(rootRef.current) : null
      if (thumb) thumb.style.viewTransitionName = ''
      if (hero) {
        hero.style.viewTransitionName = 'proj'
        s.hero = hero
      }
    }
    if (vt) {
      const t = document.startViewTransition(render)
      t.finished.finally(() => {
        if (s.hero) s.hero.style.viewTransitionName = ''
        s.hero = null
      })
    } else render()
  }

  function closeNow() {
    const s = S.current
    const o = s.ov
    if (!o) return
    const vt = canVT()
    const root = rootRef.current
    const hero = vt && root && root.scrollTop < 240 ? findHero(root) : null
    const thumb = hero ? cardFor(o.slug) : null
    const done = () => {
      s.ov = null
      flushSync(() => setOv(null))
      if (s.unlock) s.unlock()
      s.unlock = null
      if (Math.abs(window.scrollY - s.scrollY) > 1) window.scrollTo({top: s.scrollY, behavior: 'instant'})
      document.title = s.title
      if (s.opener && s.opener.isConnected && s.opener.focus) s.opener.focus({preventScroll: true})
      if (thumb) thumb.style.viewTransitionName = 'proj'
    }
    if (hero && thumb) {
      hero.style.viewTransitionName = 'proj'
      const t = document.startViewTransition(done)
      t.finished.finally(() => (thumb.style.viewTransitionName = ''))
    } else if (vt) document.startViewTransition(done)
    else done()
  }

  function requestClose() {
    if (window.history.state && window.history.state.mrw === 'ov') window.history.back()
    else closeNow()
  }

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const u = new URL(a.href, window.location.href)
      if (u.origin !== window.location.origin || window.location.pathname.startsWith('/preview')) return
      const path = norm(u.pathname)
      if (S.current.ov && a.closest('.ov') && path === '/work/') {
        e.preventDefault()
        requestClose()
        return
      }
      const m = PROJECT.exec(path)
      if (!m || m[1] === '_') return
      // a project page opened directly keeps its normal links
      if (!S.current.ov && PROJECT.test(norm(window.location.pathname))) return
      e.preventDefault()
      show(path, {link: a})
    }
    const warm = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="/work/"]') : null
      if (!a) return
      const path = norm(new URL(a.href, window.location.href).pathname)
      if (PROJECT.test(path) && !window.location.pathname.startsWith('/preview')) load(path).catch(() => {})
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && S.current.ov && !document.querySelector('.lb')) requestClose()
    }
    document.addEventListener('click', onClick)
    document.addEventListener('pointerover', warm)
    document.addEventListener('touchstart', warm, {passive: true})
    window.addEventListener('keydown', onKey)
    const off = onPop((e) => {
      const path = norm(window.location.pathname)
      const m = PROJECT.exec(path)
      const st = e.state
      if (m && st && (st.mrw === 'ov' || st.mrw === 'lb')) {
        if (!S.current.ov || S.current.ov.slug !== m[1]) show(path, {pop: true})
      } else if (S.current.ov) closeNow()
    })
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('pointerover', warm)
      document.removeEventListener('touchstart', warm)
      window.removeEventListener('keydown', onKey)
      off()
    }
  }, []) // eslint-disable-line

  const isOpen = !!ov

  // keep the page behind out of reach of the keyboard and screen readers
  useEffect(() => {
    if (!isOpen) return
    const others = [...document.body.children].filter((el) => el !== rootRef.current && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert'))
    others.forEach((el) => el.setAttribute('inert', ''))
    if (rootRef.current) rootRef.current.focus({preventScroll: true})
    return () => others.forEach((el) => el.removeAttribute('inert'))
  }, [isOpen])

  // looping videos play only while they are on screen (same behaviour as the Video component)
  useEffect(() => {
    const root = rootRef.current
    if (!ov || !root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const vids = [...root.querySelectorAll('video')]
    if (!vids.length) return
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), {threshold: 0.1})
    vids.forEach((v) => {
      v.muted = true
      v.setAttribute('playsinline', '')
      io.observe(v)
    })
    return () => io.disconnect()
  }, [ov && ov.key]) // eslint-disable-line

  if (!ov) return null
  return (
    <div ref={rootRef} className={`ov${ov.dark ? ' dark' : ''}${ov.enter ? ' enter' : ''}`} role="dialog" aria-modal="true" aria-label={ov.title} tabIndex={-1}>
      <div className="ov-bar">
        <a href="/" className="ov-logo" aria-label="Maruf Raihan Works, home">
          <Mark />
        </a>
        <button type="button" className="txtbtn" onClick={requestClose}>
          Close
        </button>
      </div>
      <div key={ov.key} className={`ov-body${ov.swap ? ' swap' : ''}`} dangerouslySetInnerHTML={{__html: ov.html}} />
    </div>
  )
}
