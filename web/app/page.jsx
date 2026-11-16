import Header from '@/components/Header'
import Img from '@/components/Img'
import Video from '@/components/Video'
import Card from '@/components/Card'
import {getHome, getProjects, getPosts, getSettings, DISCIPLINES} from '@/lib/data'
import {imgUrl} from '@/lib/img'
import {fmtDate} from '@/lib/format'
import {interleave} from '@/lib/order'

const LAYOUT = [
  ['s8', 3 / 2, ''],
  ['s4 off', 4 / 5, ''],
  ['s5', 1, ''],
  ['s7 off', 16 / 10, ''],
  ['s6', 4 / 3, ''],
  ['s6', 4 / 3, ''],
]

export default async function Home() {
  const [home, projects, posts, settings] = await Promise.all([getHome(), getProjects(), getPosts(), getSettings()])
  const featured = interleave(projects.filter((p) => p.featured).sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))).slice(0, 12)
  const poster = home.poster ? imgUrl(home.poster, 1600) : undefined
  return (
    <>
      <div className="hero">
        {home.reel?.url ? (
          <>
            <Video className={home.reelMobile?.url ? 'only-d' : ''} src={home.reel.url} poster={poster} label="Showreel" />
            {home.reelMobile?.url && <Video className="only-m" src={home.reelMobile.url} poster={poster} label="Showreel" />}
          </>
        ) : (
          <Img image={home.poster || featured[0]?.cover} eager />
        )}
        <div className="scrim" />
        <Header variant="over" settings={settings} />
        <div className="copy">
          <h1>{home.headline || 'Architecture, image and light.'}</h1>
          <div className="meta small">
            <span>Dhaka, Bangladesh</span>
          </div>
        </div>
      </div>

      <main id="main">
        <div className="wrap intro fade">
          <div className="small muted">Studio</div>
          <div>
            {home.intro && <p>{home.intro}</p>}
            <div className="disc">
              {DISCIPLINES.map(([v, l]) => (
                <a key={v} className="tlink" href={`/work/?discipline=${v}`}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        {featured.length > 0 && (
          <div className="wrap">
            <div className="shead">
              <h2>Selected work</h2>
              <a className="arrow" href="/work/">
                All work →
              </a>
            </div>
            <div className="sel">
              {featured.map((p, i) => {
                const [cls, ratio] = LAYOUT[i % LAYOUT.length]
                return <Card key={p._id} p={p} ratio={ratio} className={`${cls} fade`} sizes="(max-width: 820px) 100vw, 60vw" showClient={false} />
              })}
            </div>
          </div>
        )}

        <div className="dark" style={{marginTop: 'clamp(80px,10vw,160px)'}}>
          <div className="wrap band">
            <div className="sq fade">{home.servicesVideo?.url ? <Video src={home.servicesVideo.url} poster={home.servicesImage ? imgUrl(home.servicesImage, 900) : undefined} label="Studio work" /> : <Img image={home.servicesImage} ratio={1} />}</div>
            <div className="fade">
              <div className="small muted" style={{marginBottom: 18}}>
                {home.servicesLabel || 'Services'}
              </div>
              <h3>{home.servicesTitle}</h3>
              {home.servicesText && (
                <p className="muted" style={{maxWidth: '44ch', margin: 0}}>
                  {home.servicesText}
                </p>
              )}
              {home.services?.length > 0 && (
                <ul>
                  {home.services.map((s) => (
                    <li key={s._key}>
                      {s.link ? (
                        <a className="svc" href={s.link}>
                          <span>{s.name} <span aria-hidden="true">→</span></span>
                          <span className="muted">{s.note}</span>
                        </a>
                      ) : (
                        <>
                          <span>{s.name}</span>
                          <span className="muted">{s.note}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <a className="btn" href="/studio/#contact">
                {home.servicesButton || 'Start a project'} →
              </a>
            </div>
          </div>
        </div>

        {posts.length > 0 && (
          <div className="wrap" style={{paddingTop: 'clamp(80px,10vw,150px)'}}>
            <div className="shead">
              <h2>Journal</h2>
              <a className="arrow" href="/journal/">
                All posts →
              </a>
            </div>
            <div className="jr">
              {posts.slice(0, 3).map((p) => (
                <a key={p._id} href={`/journal/${p.slug}/`}>
                  <article>
                    <div className="ph">
                      <Img image={p.cover} ratio={4 / 3} sizes="(max-width: 760px) 80vw, 33vw" />
                    </div>
                    <span className="small muted">{[p.kind, fmtDate(p.date)].filter(Boolean).join(', ')}</span>
                    <h3>{p.title}</h3>
                  </article>
                </a>
              ))}
            </div>
          </div>
        )}
        <div style={{height: 'clamp(80px,10vw,150px)'}} />
      </main>
    </>
  )
}
