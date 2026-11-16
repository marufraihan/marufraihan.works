import {notFound} from 'next/navigation'
import ProjectView from '@/components/ProjectView'
import {getProject, getProjectSlugs, getProjects, getSettings, discLabel} from '@/lib/data'
import {imgUrl} from '@/lib/img'
import {interleave} from '@/lib/order'

export const dynamicParams = false
export async function generateStaticParams() {
  const slugs = await getProjectSlugs()
  return slugs.length ? slugs.map((slug) => ({slug})) : [{slug: '_'}]
}

export async function generateMetadata({params}) {
  const {slug} = await params
  const p = await getProject(slug)
  if (!p) return {}
  const desc = p.seoDescription || p.subtitle || [p.title, (p.disciplines || []).map(discLabel).join(', '), p.client, p.location].filter(Boolean).join(' · ')
  return {title: p.title, description: desc, alternates: {canonical: `/work/${p.slug}/`}, openGraph: {title: p.title, description: desc, images: p.cover ? [imgUrl(p.cover, 1200, 630)] : []}}
}

export default async function ProjectPage({params}) {
  const {slug} = await params
  const [p, allProjects, settings] = await Promise.all([getProject(slug), getProjects(), getSettings()])
  const all = interleave(allProjects) // same order as the Work page, so Next project follows it
  if (!p) notFound()
  return <ProjectView p={p} all={all} settings={settings} />
}
