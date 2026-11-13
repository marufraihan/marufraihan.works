'use client'
import {useEffect, useState} from 'react'
import Logo from './Logo'

const NAV = [
  ['/work/', 'Work'],
  ['/studio/', 'Studio'],
  ['/journal/', 'Journal'],
  ['/studio/#contact', 'Contact'],
]

export default function Header({variant = 'light', current, settings = {}}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const k = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])
  return (
    <>
      <header className={`site ${variant}`}>
        <Logo />
        <nav className="main" aria-label="Main">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className={current === label ? 'cur' : undefined} aria-current={current === label ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <button className="menubtn" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(true)}>
          Menu
        </button>
      </header>
      {open && (
        <div id="menu" className="menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="menu-top">
            <Logo />
            <button className="menubtn" type="button" onClick={() => setOpen(false)} autoFocus>
              Close
            </button>
          </div>
          <nav aria-label="Main">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="menu-foot">
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings.phone && <span>{settings.phone}</span>}
          </div>
        </div>
      )}
    </>
  )
}
