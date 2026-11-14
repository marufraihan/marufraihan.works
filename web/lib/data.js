import {createClient} from '@sanity/client'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wgudx0eu'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const FIXTURE = process.env.SANITY_FIXTURE // local testing without Sanity

const client = createClient({projectId, dataset, apiVersion: '2025-01-01', useCdn: false, perspective: 'published'})

export const IMG = `{..., "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height, "lqip": asset->metadata.lqip, "url": asset->url}`
export const FILE = `{"url": asset->url}`
export const CARD = `_id, title, "slug": slug.current, disciplines, categories, client, year, sortDate, featured, featuredOrder,
  "cover": coalesce(cover, media[_type == "photo"][0])${IMG}`
export const PROJECT = `${CARD}, subtitle, story, system, outcome, location, period, area, scope, role, credits, links, videoUrl, seoDescription,
  "heroVideo": heroVideo${FILE},
  media[]{..., _type == "photo" => ${IMG}, _type == "loop" => {"url": asset->url, caption}}`

let fixtureCache
function fixture() {
  if (!fixtureCache) fixtureCache = JSON.parse(globalThis.process.getBuiltinModule('node:fs').readFileSync(FIXTURE, 'utf8'))
  return fixtureCache
}

async function q(query, params = {}) {
  return client.fetch(query, params)
}

export async function getSettings() {
  if (FIXTURE) return fixture().settings || {}
  return (await q(`*[_id == "settings"][0]`)) || {}
}
export async function getHome() {
  if (FIXTURE) return fixture().home || {}
  return (await q(`*[_id == "home"][0]{..., "reel": reel${FILE}, "reelMobile": reelMobile${FILE}, "servicesVideo": servicesVideo${FILE}, poster${IMG}, servicesImage${IMG}}`)) || {}
}
export async function getStudio() {
  const r = FIXTURE ? fixture().studio : await q(`{"page": *[_id == "studioPage"][0]{..., portrait${IMG}}, "team": *[_type == "member" && !(_id in path("drafts.**"))] | order(order asc){..., photo${IMG}}}`)
  return {page: r?.page || {}, team: r?.team || []}
}
export async function getProjects() {
  if (FIXTURE) return fixture().projects
  return q(`*[_type == "project" && defined(slug.current) && !(_id in path("drafts.**"))]{${CARD}} | order(coalesce(sortDate, "0") desc, title asc)`)
}
export const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0]{${PROJECT}}`
export async function getProject(slug) {
  if (FIXTURE) return fixture().full.find((p) => p.slug === slug) || null
  return q(`*[_type == "project" && slug.current == $slug && !(_id in path("drafts.**"))][0]{${PROJECT}}`, {slug})
}
export async function getProjectSlugs() {
  if (FIXTURE) return fixture().projects.map((p) => p.slug)
  return q(`*[_type == "project" && defined(slug.current) && !(_id in path("drafts.**"))].slug.current`)
}
export async function getPosts() {
  if (FIXTURE) return fixture().posts || []
  return q(`*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))] | order(date desc){_id, title, "slug": slug.current, date, kind, cover${IMG}}`)
}
export async function getPost(slug) {
  if (FIXTURE) return (fixture().posts || []).find((p) => p.slug === slug) || null
  return q(`*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]{..., "slug": slug.current, cover${IMG}, body[]{..., _type == "image" => ${IMG}}, "project": project->{title, "slug": slug.current}}`, {slug})
}
export async function getPostSlugs() {
  if (FIXTURE) return (fixture().posts || []).map((p) => p.slug)
  return q(`*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))].slug.current`)
}
export async function getRedirectData() {
  if (FIXTURE) return {projects: fixture().full.map((p) => ({slug: p.slug, oldUrls: p.oldUrls || []})), extra: []}
  return q(`{"projects": *[_type == "project" && defined(slug.current) && !(_id in path("drafts.**"))]{"slug": slug.current, oldUrls}, "extra": *[_type == "redirect" && !(_id in path("drafts.**"))]{from, to}}`)
}

export const isDark = (p) => ['experiential', 'film'].includes((p?.disciplines || [])[0])
export const DISCIPLINES = [
  ['architecture', 'Architecture'],
  ['photography', 'Photography'],
  ['experiential', 'Experiential'],
  ['film', 'Film'],
]
export const discLabel = (d) => (DISCIPLINES.find(([v]) => v === d) || [d, d])[1]
