'use client'
import {useEffect, useMemo, useState} from 'react'
import Img from './Img'

const DISC = [
  ['all', 'All'],
  ['architecture', 'Architecture'],
  ['photography', 'Photography'],
  ['experiential', 'Experiential'],
  ['film', 'Film'],
]
const label = (d) => (DISC.find(([v]) => v === d) || [d, d])[1]

export default function WorkIndex({projects}) {
  const [disc, setDisc] = useState('all')
  const [cat, setCat] = useState('')
  const [view, setView] = useState('grid')

  useEffect(() => {
    const u = new URL(window.location.href)
    const d = u.searchParams.get('discipline')
    if (d && DISC.some(([v]) => v === d)) setDisc(d)
    const c = u.searchParams.get('category')
    if (c) setCat(c)
    try {
      const v = localStorage.getItem('work-view')
      if (v === 'list' || v === 'grid') setView(v)
    } catch {}
  }, [])

  function choose(d, c = '') {
    setDisc(d)
    setCat(c)
    const u = new URL(window.location.href)
    d === 'all' ? u.searchParams.delete('discipline') : u.searchParams.set('discipline', d)
    c ? u.searchParams.set('category', c) : u.searchParams.delete('category')
    window.history.replaceState(null, '', u)
  }
  function pickView(v) {
    setView(v)
    try {
      localStorage.setItem('work-view', v)
    } catch {}
  }

  const counts = useMemo(() => Object.fromEntries(DISC.map(([v]) => [v, v === 'all' ? projects.length : projects.filter((p) => (p.disciplines || []).includes(v)).length])), [projects])
  const inDisc = projects.filter((p) => disc === 'all' || (p.disciplines || []).includes(disc))
  const cats = useMemo(() => {
    const m = new Map()
    inDisc.forEach((p) => (p.categories || []).forEach((c) => m.set(c, (m.get(c) || 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [disc, projects]) // eslint-disable-line
  const list = inDisc.filter((p) => !cat || (p.categories || []).includes(cat))

  return (
    <>
      <div className="bar">
        <div className="filters" role="group" aria-label="Filter by discipline">
          {DISC.filter(([v]) => v === 'all' || counts[v] > 0).map(([v, l]) => (
            <button key={v} type="button" className={`tlink ${disc === v ? 'on' : ''}`} aria-pressed={disc === v} onClick={() => choose(v)}>
              {l}
              <span className="count">{counts[v]}</span>
            </button>
          ))}
        </div>
        <div className="filters views" style={{flex: 'none'}} role="group" aria-label="View">
          {['grid', 'list'].map((v) => (
            <button key={v} type="button" className={`tlink ${view === v ? 'on' : ''}`} aria-pressed={view === v} onClick={() => pickView(v)}>
              {v === 'grid' ? 'Grid' : 'List'}
            </button>
          ))}
        </div>
      </div>
      {cats.length > 1 && (
        <div className="subbar" role="group" aria-label="Filter by category">
          <button type="button" className={`tlink ${!cat ? 'on' : ''}`} onClick={() => choose(disc)}>
            All {disc === 'all' ? '' : label(disc).toLowerCase()}
          </button>
          {cats.map(([c, n]) => (
            <button key={c} type="button" className={`tlink ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => choose(disc, c)}>
              {c}
              <span className="count">{n}</span>
            </button>
          ))}
        </div>
      )}
      {list.length === 0 && <p className="empty-note">No projects here yet.</p>}
      {view === 'grid' ? (
        <div className="grid">
          {list.map((p) => (
            <a key={p._id} className="card" href={`/work/${p.slug}/`}>
              <div className="ph">
                <Img image={p.cover} ratio={4 / 3} sizes="(max-width: 760px) 50vw, 25vw" alt={p.title} />
              </div>
              <div className="cap">
                <b>{p.title}</b>
                <span className="small muted">{[(p.disciplines || []).map(label).join(', '), p.year].filter(Boolean).join(', ')}</span>
              </div>
              {p.client && (
                <span className="muted client" style={{fontSize: 15, marginTop: -6}}>
                  {p.client}
                </span>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className="list">
          {list.map((p) => (
            <a key={p._id} className="row" href={`/work/${p.slug}/`}>
              <span className="small muted">{p.year}</span>
              <b>{p.title}</b>
              <span className="c3 muted">{p.client}</span>
              <span className="c4 small muted">{(p.disciplines || []).map(label).join(', ')}</span>
              <span className="th">
                <Img image={p.cover} ratio={3 / 2} sizes="120px" alt="" />
              </span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
