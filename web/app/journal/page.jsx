import Header from '@/components/Header'
import Img from '@/components/Img'
import {getPosts, getSettings} from '@/lib/data'
import {fmtDate} from '@/lib/format'

export const metadata = {title: 'Journal'}

export default async function Journal() {
  const [posts, s] = await Promise.all([getPosts(), getSettings()])
  return (
    <>
      <Header current="Journal" settings={s} />
      <main id="main" className="wrap">
        <div className="wtop">
          <h1>Journal</h1>
          <p className="muted" style={{margin: 0, maxWidth: '36ch'}}>
            News, shoots, exhibitions and press.
          </p>
        </div>
        {posts.length === 0 ? (
          <p className="empty-note">The first posts are on their way.</p>
        ) : (
          <div className="jr" style={{borderTop: '1px solid var(--line)', paddingTop: 28}}>
            {posts.map((p) => (
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
        )}
        <div style={{height: 120}} />
      </main>
    </>
  )
}
