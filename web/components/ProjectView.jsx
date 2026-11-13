import Header from './Header'
import Img from './Img'
import Video from './Video'
import Text from './Text'
import {isDark, discLabel} from '@/lib/data'
import {imgUrl} from '@/lib/img'
import {sequence, embedUrl} from '@/lib/sequence'

function Media({row, dark}) {
  const sizesFull = '100vw'
  switch (row.kind) {
    case 'loop':
      return <div className="full"><Video src={row.items[0].url} label={row.items[0].caption} /></div>
    case 'drawings':
      return (
        <figure>
          <div className="drawings">{row.items.map((m) => <Img key={m._key} image={m} contain sizes="(max-width: 820px) 100vw, 45vw" />)}</div>
          {row.items.some((m) => m.caption) && <figcaption className="small muted">{row.items.map((m) => m.caption).filter(Boolean).join(' · ')}</figcaption>}
        </figure>
      )
    case 'pair':
      return (
        <div className="pair">
          {row.items.map((m) => (
            <figure key={m._key}>
              <Img image={m} sizes="(max-width: 820px) 100vw, 50vw" />
              {m.caption && <figcaption className="small muted">{m.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )
    case 'narrow':
    case 'indent':
    case 'full':
    default: {
      const m = row.items[0]
      return (
        <figure className={row.kind === 'narrow' ? 'narrow' : row.kind === 'indent' ? 'indent' : ''}>
          <Img image={m} sizes={row.kind === 'full' ? sizesFull : '80vw'} />
          {m.caption && <figcaption className="small muted">{m.caption}</figcaption>}
        </figure>
      )
    }
  }
}

export default function ProjectView({p, all = [], settings = {}}) {
  if (!p) return null
  const dark = isDark(p)
  const idx = all.findIndex((x) => x.slug === p.slug)
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null
  const facts = [
    ['Client', p.client],
    ['Location', p.location],
    ['Area', p.area],
    ['Built', p.period],
    ['Year', p.year],
    ['Scope', p.scope],
    ['Our role', dark ? null : p.role],
    ['Discipline', (p.disciplines || []).map(discLabel).join(', ')],
  ].filter(([, v]) => v)
  const rows = sequence((p.media || []).filter((m) => !(p.cover?.asset?._ref && m.asset?._ref === p.cover.asset._ref && m === p.media[0])))
  const film = embedUrl(p.videoUrl)
  const posterUrl = p.cover ? imgUrl(p.cover, 1600) : undefined

  const credits = (
    <>
      {(p.credits?.length > 0 || p.links?.length > 0) && (
        <div className="credits">
          {(p.credits || []).map((c) => (
            <div key={c._key}>
              <span className="small muted">{c.role}</span>
              <p>{c.name}</p>
            </div>
          ))}
          {(p.links || []).map((l) => (
            <div key={l._key}>
              <span className="small muted">Published</span>
              <p>
                <a href={l.url} rel="noopener" target="_blank">
                  {l.label || 'Article'}
                </a>
              </p>
            </div>
          ))}
        </div>
      )}
      {next && (
        <a className="next" href={`/work/${next.slug}/`}>
          <div>
            <span className="small muted">Next project</span>
            <div className="t">{next.title}</div>
          </div>
          <div className="th">
            <Img image={next.cover} ratio={4 / 3} sizes="360px" alt="" />
          </div>
        </a>
      )}
    </>
  )

  if (dark) {
    return (
      <div className="dark">
        <Header variant="night" current="Work" settings={settings} />
        <main id="main">
          <div className="xhero">
            {p.heroVideo?.url ? <Video src={p.heroVideo.url} poster={posterUrl} label={p.title} /> : <Img image={p.cover} eager />}
            <div className="scrim" />
            <div className="copy">
              <h1>{p.title}</h1>
              <div className="small" style={{display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right'}}>
                <span>{(p.disciplines || []).map(discLabel).join(', ')}</span>
                {p.client && <span>{p.client}</span>}
                {p.year && <span>{p.year}</span>}
              </div>
            </div>
          </div>
          <div className="wrap blocks">
            {p.story?.length > 0 && (
              <div>
                <h2>Context</h2>
                <Text value={p.story} className="blocks-txt" />
              </div>
            )}
            {p.system && (
              <div>
                <h2>System / tools</h2>
                <p>{p.system}</p>
              </div>
            )}
            {p.role && (
              <div>
                <h2>Our role</h2>
                <p>{p.role}</p>
              </div>
            )}
            {p.outcome && (
              <div>
                <h2>Outcome</h2>
                <p>{p.outcome}</p>
              </div>
            )}
          </div>
          <div className="wrap seq">
            {film && (
              <div className="embed">
                <iframe src={film} title={`${p.title} film`} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              </div>
            )}
            {rows.map((r, i) => (
              <Media key={i} row={r} dark />
            ))}
          </div>
          <div className="wrap">{credits}</div>
        </main>
      </div>
    )
  }

  return (
    <>
      <Header current="Work" settings={settings} />
      <main id="main">
        <div className="wrap ptop">
          <div className="small muted">
            <a href="/work/">Work</a> / {(p.disciplines || []).map(discLabel).join(', ')}
          </div>
          <div>
            <h1>{p.title}</h1>
            {p.subtitle && <p className="sub">{p.subtitle}</p>}
          </div>
        </div>
        <div className="full hero-img">{p.heroVideo?.url ? <Video src={p.heroVideo.url} poster={posterUrl} label={p.title} /> : <Img image={p.cover || p.media?.[0]} eager />}</div>
        <div className="wrap story">
          <dl className="facts">
            {facts.map(([k, v]) => (
              <div key={k} style={{display: 'contents'}}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <Text value={p.story} className="txt" />
        </div>
        <div className="wrap seq">
          {rows.map((r, i) => (
            <Media key={i} row={r} />
          ))}
          {film && (
            <div className="embed">
              <iframe src={film} title={`${p.title} film`} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            </div>
          )}
        </div>
        <div className="wrap">{credits}</div>
      </main>
    </>
  )
}
