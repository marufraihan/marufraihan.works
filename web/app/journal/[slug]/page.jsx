import {notFound} from 'next/navigation'
import Header from '@/components/Header'
import Img from '@/components/Img'
import Text from '@/components/Text'
import {getPost, getPostSlugs, getSettings} from '@/lib/data'
import {fmtDate} from '@/lib/format'

export const dynamicParams = false
export async function generateStaticParams() {
  const s = await getPostSlugs()
  return s.length ? s.map((slug) => ({slug})) : [{slug: '_'}]
}
export async function generateMetadata({params}) {
  const {slug} = await params
  const p = await getPost(slug)
  return p ? {title: p.title} : {}
}
export default async function Post({params}) {
  const {slug} = await params
  const [p, s] = await Promise.all([getPost(slug), getSettings()])
  if (!p) notFound()
  return (
    <>
      <Header current="Journal" settings={s} />
      <main id="main" className="wrap">
        <article className="post">
          <span className="small muted">
            <a href="/journal/">Journal</a> / {[p.kind, fmtDate(p.date)].filter(Boolean).join(', ')}
          </span>
          <h1>{p.title}</h1>
          {p.cover && <Img image={p.cover} eager sizes="(max-width: 860px) 100vw, 820px" />}
          <Text value={p.body} className="txt" />
          {p.project && (
            <p style={{marginTop: 40}}>
              <a className="arrow" href={`/work/${p.project.slug}/`}>
                See the project: {p.project.title} →
              </a>
            </p>
          )}
        </article>
      </main>
    </>
  )
}
