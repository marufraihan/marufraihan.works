import {useEffect, useMemo, useState, useCallback} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

const DISC = ['architecture', 'photography', 'experiential', 'film']
const QUERY = `*[_type == "project" && !(_id in path("drafts.**"))]{
  _id, title, disciplines, categories, client, year, featured, featuredOrder, "photos": count(media), "slug": slug.current,
  "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id), _updatedAt
} | order(_updatedAt desc)`

const cell = {padding: '6px 8px', borderBottom: '1px solid var(--card-border-color, #e3e3e0)', borderRight: '1px solid var(--card-border-color, #e3e3e0)', verticalAlign: 'middle'}
const input = {width: '100%', border: 0, background: 'transparent', font: 'inherit', color: 'inherit', padding: '4px 2px'}

export function TableTool() {
  const client = useClient({apiVersion: '2025-01-01'})
  const [rows, setRows] = useState(null)
  const [edits, setEdits] = useState({})
  const [q, setQ] = useState('')
  const [disc, setDisc] = useState('')
  const [sort, setSort] = useState({k: '_updatedAt', dir: -1})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(() => client.fetch(QUERY).then(setRows), [client])
  useEffect(() => {
    load()
  }, [load])

  const val = (r, k) => (edits[r._id] && k in edits[r._id] ? edits[r._id][k] : r[k])
  const set = (id, k, v) => setEdits((e) => ({...e, [id]: {...(e[id] || {}), [k]: v}}))

  const list = useMemo(() => {
    if (!rows) return []
    const ql = q.toLowerCase()
    return rows
      .filter((r) => (!disc || (r.disciplines || []).includes(disc)) && [r.title, r.client, (r.categories || []).join(' ')].join(' ').toLowerCase().includes(ql))
      .sort((a, b) => {
        const x = a[sort.k] ?? '', y = b[sort.k] ?? ''
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
      })
  }, [rows, q, disc, sort])

  const count = Object.keys(edits).length

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const tx = client.transaction()
      for (const [id, patch] of Object.entries(edits)) {
        const p = {...patch}
        if (typeof p.categories === 'string') p.categories = p.categories.split(',').map((s) => s.trim()).filter(Boolean)
        if (p.featuredOrder === '') p.featuredOrder = null
        else if (p.featuredOrder !== undefined) p.featuredOrder = Number(p.featuredOrder)
        const unset = Object.keys(p).filter((k) => p[k] === null)
        unset.forEach((k) => delete p[k])
        const row = rows.find((r) => r._id === id)
        for (const target of row?.hasDraft ? [id, 'drafts.' + id] : [id]) {
          tx.patch(target, (pt) => {
            let x = pt.set(p)
            if (unset.length) x = x.unset(unset)
            return x
          })
        }
      }
      await tx.commit({visibility: 'async'})
      setEdits({})
      setMsg(`Published ${count} project${count === 1 ? '' : 's'}. The site updates in a few minutes.`)
      load()
    } catch (e) {
      setMsg('Could not save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const th = (k, label) => (
    <th onClick={() => setSort((s) => ({k, dir: s.k === k ? -s.dir : 1}))} style={{...cell, position: 'sticky', top: 0, background: 'var(--card-bg-color, #f6f6f5)', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, zIndex: 1}}>
      {label}
      {sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}
    </th>
  )

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', fontSize: 13}}>
      <div style={{display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--card-border-color, #e3e3e0)', flexWrap: 'wrap'}}>
        <strong style={{fontSize: 15}}>All projects</strong>
        <span style={{opacity: 0.6}}>{rows ? `${list.length} of ${rows.length}` : 'Loading…'}</span>
        <div style={{flex: 1}} />
        <input placeholder="Filter by title, client or category" value={q} onChange={(e) => setQ(e.target.value)} style={{padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc', width: 260, font: 'inherit'}} aria-label="Filter" />
        <select value={disc} onChange={(e) => setDisc(e.target.value)} style={{padding: '7px 10px', borderRadius: 6, font: 'inherit'}} aria-label="Discipline">
          <option value="">All disciplines</option>
          {DISC.map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setEdits({})} disabled={!count || saving} style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: 'transparent', font: 'inherit', cursor: 'pointer'}}>
          Discard
        </button>
        <button type="button" onClick={save} disabled={!count || saving} style={{padding: '8px 14px', borderRadius: 6, border: 0, background: count ? '#1E8A4C' : '#9BC8AE', color: '#fff', font: 'inherit', fontWeight: 600, cursor: count ? 'pointer' : 'default'}}>
          {saving ? 'Publishing…' : count ? `Publish ${count} change${count === 1 ? '' : 's'}` : 'Publish changes'}
        </button>
      </div>
      {msg && <div style={{padding: '8px 16px', background: '#FFF8E1', color: '#6E5410'}}>{msg}</div>}
      <div style={{overflow: 'auto', flex: 1}}>
        <table style={{borderCollapse: 'separate', borderSpacing: 0, width: '100%'}}>
          <thead>
            <tr>
              {th('title', 'Title')}
              <th style={{...cell, position: 'sticky', top: 0, background: 'var(--card-bg-color, #f6f6f5)', textAlign: 'left', zIndex: 1}}>Discipline</th>
              {th('categories', 'Categories')}
              {th('client', 'Client')}
              {th('year', 'Year')}
              {th('photos', 'Photos')}
              {th('featured', 'Homepage')}
              {th('featuredOrder', 'Position')}
              <th style={{...cell, position: 'sticky', top: 0, background: 'var(--card-bg-color, #f6f6f5)', zIndex: 1}} />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const changed = !!edits[r._id]
              const d = val(r, 'disciplines') || []
              return (
                <tr key={r._id} style={{background: changed ? 'rgba(255, 214, 102, .18)' : undefined}}>
                  <td style={{...cell, minWidth: 220}}>
                    <input style={input} value={val(r, 'title') || ''} onChange={(e) => set(r._id, 'title', e.target.value)} aria-label="Title" />
                  </td>
                  <td style={{...cell, whiteSpace: 'nowrap'}}>
                    {DISC.map((x) => (
                      <label key={x} title={x} style={{marginRight: 8, cursor: 'pointer'}}>
                        <input type="checkbox" checked={d.includes(x)} onChange={(e) => set(r._id, 'disciplines', e.target.checked ? [...d, x] : d.filter((y) => y !== x))} /> {x[0].toUpperCase()}
                      </label>
                    ))}
                  </td>
                  <td style={{...cell, minWidth: 160}}>
                    <input style={input} value={Array.isArray(val(r, 'categories')) ? val(r, 'categories').join(', ') : val(r, 'categories') || ''} onChange={(e) => set(r._id, 'categories', e.target.value)} aria-label="Categories" />
                  </td>
                  <td style={{...cell, minWidth: 180}}>
                    <input style={input} value={val(r, 'client') || ''} onChange={(e) => set(r._id, 'client', e.target.value)} aria-label="Client" />
                  </td>
                  <td style={{...cell, width: 80}}>
                    <input style={input} value={val(r, 'year') || ''} onChange={(e) => set(r._id, 'year', e.target.value)} aria-label="Year" />
                  </td>
                  <td style={{...cell, width: 60, textAlign: 'right', opacity: 0.7}}>{r.photos || 0}</td>
                  <td style={{...cell, width: 80, textAlign: 'center'}}>
                    <input type="checkbox" checked={!!val(r, 'featured')} onChange={(e) => set(r._id, 'featured', e.target.checked)} aria-label="Show on homepage" />
                  </td>
                  <td style={{...cell, width: 70}}>
                    <input style={input} type="number" value={val(r, 'featuredOrder') ?? ''} onChange={(e) => set(r._id, 'featuredOrder', e.target.value)} aria-label="Homepage position" />
                  </td>
                  <td style={{...cell, whiteSpace: 'nowrap'}}>
                    <IntentLink intent="edit" params={{id: r._id, type: 'project'}}>Open</IntentLink>
                    {r.hasDraft ? <span title="This project has unpublished edits in its editor" style={{marginLeft: 8, color: '#B7791F'}}>●</span> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
