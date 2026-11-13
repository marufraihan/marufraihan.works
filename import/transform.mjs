// Turns the Wix CMS CSV exports into Sanity documents.
// Media is described by its Wix source URL (wixSrc); import.mjs uploads it and swaps in Sanity assets.
import fs from 'node:fs'
import path from 'node:path'
import {parse} from 'csv-parse/sync'

const HERE = path.dirname(new URL(import.meta.url).pathname)

const COLLECTIONS = {
  'ArchitecturalProject.csv': {discipline: 'architecture'},
  'ExperientialPortfolio.csv': {discipline: 'experiential'},
  'Photography-CommercialsRetails.csv': {discipline: 'photography', category: 'Commercial & Retail'},
  'Photography-Institutes.csv': {discipline: 'photography', category: 'Institutes'},
  'Photography-PublicPlaces.csv': {discipline: 'photography', category: 'Public Places'},
  'Photography-Recreational.csv': {discipline: 'photography', category: 'Restaurants & Resorts'},
  'Photography-Residences.csv': {discipline: 'photography', category: 'Residences'},
  'Photography-SpecialProjects.csv': {discipline: 'photography', category: 'Special Projects'},
}

// Projects shown on the homepage at launch (can be changed in the CMS).
const FEATURED = ['Hawladar Bari', 'Varendra University', 'Immersive for UCB Night', 'Immersive for Good Vibes Only', 'Daktar Bari', 'Laser and LED for Heidelberg']

const TITLE_FIX = {'Titktok Awards': 'TikTok Awards', 'Meril Prothom alo Award 2024': 'Meril Prothom Alo Awards 2024'}

// Two Wix items shared one address; the second gets "-2".
const SLUG_OVERRIDES = {
  'Immersive for Good Vibes Only': {slug: 'immersive-for-good-vibes-only'},
  'Immersive for Art and Music Fest': {slug: 'immersive-for-art-and-music-fest', extraOld: ["/experiential-portfolio/immersive-for-let's-vibe-2"], dropOld: true},
}

const decode = (s) =>
  String(s ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
export const text = (html) => decode(String(html ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim()
const lines = (html) => text(html).split('\n').map((s) => s.trim()).filter(Boolean)
const meaningful = (s) => s && s.replace(/[.\s\-–]/g, '').length > 2

export const cleanSlug = (s) =>
  decodeURIComponent(decode(s))
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function wixImage(src) {
  const m = /^wix:image:\/\/v1\/([^/#]+)(?:\/([^#]*))?/.exec(src || '')
  if (!m) return null
  const w = /originWidth=(\d+)/.exec(src), h = /originHeight=(\d+)/.exec(src)
  return {url: `https://static.wixstatic.com/media/${m[1]}`, id: m[1], name: decodeURIComponent(m[2] || m[1]), width: w ? +w[1] : null, height: h ? +h[1] : null}
}
export function wixVideo(src) {
  const m = /^wix:video:\/\/v1\/([^/#]+)\/([^#]*)/.exec(src || '')
  if (!m) return null
  const poster = /posterUri=([^&]+)/.exec(src)
  return {url: `https://video.wixstatic.com/video/${m[1]}/1080p/mp4/file.mp4`, fallback: `https://video.wixstatic.com/video/${m[1]}/720p/mp4/file.mp4`, id: m[1], name: decodeURIComponent(m[2]), poster: poster ? `https://static.wixstatic.com/media/${poster[1]}` : null}
}
function gallery(json) {
  if (!json || !json.trim().startsWith('[')) return []
  try {
    return JSON.parse(json)
      .filter((g) => (g.type || 'image') === 'image')
      .map((g) => ({...wixImage(g.src), caption: decode(g.description || '').trim()}))
      .filter((g) => g.url)
  } catch {
    return []
  }
}
const firstYear = (s) => (/(19|20)\d\d/.exec(s || '') || [])[0] || ''
let keySeq = 0
const key = () => (++keySeq).toString(36).padStart(6, '0')
const para = (t) => ({_type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{_type: 'span', _key: key(), text: t, marks: []}]})

// "Key: Value" lines from the Architecture "Team" field
function facts(html) {
  const out = []
  for (const l of lines(html)) {
    const i = l.indexOf(':')
    if (i > 0) out.push([l.slice(0, i).trim(), l.slice(i + 1).trim()])
  }
  return out
}
const sentence = (s) => s.split(' ').map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w === w.toUpperCase() ? w : w.toLowerCase())).join(' ')
const ROLE_FIX = {'Lead Architects': 'Lead architect', Costruction: 'Construction', 'Designed by': 'Design', '3 D Visualizer': '3D visualiser', 'Calligrapher For Interior': 'Interior calligraphy', 'Project Write Up': 'Write-up', 'Structural Consultant, Mep And Construction Team': 'Structure, MEP & construction'}

export function loadProjects(csvDir = path.join(HERE, 'csv')) {
  const docs = []
  for (const [file, info] of Object.entries(COLLECTIONS)) {
    const p = path.join(csvDir, file)
    if (!fs.existsSync(p)) continue
    const rows = parse(fs.readFileSync(p, 'utf8'), {columns: true, bom: true, relax_quotes: true, skip_empty_lines: true})
    for (const r of rows) {
      const title = TITLE_FIX[(r.Title || '').trim()] || (r.Title || '').trim()
      if (!title) continue
      const urlCol = Object.keys(r).find((k) => /\((Title|Item)\)$/.test(k) && /^\//.test(r[k] || ''))
      const oldUrl = decode(r[urlCol] || '')
      const override = SLUG_OVERRIDES[title] || {}
      let slug = override.slug || cleanSlug(title)
      if (docs.some((d) => d.slug.current === slug)) slug = `${slug}-${cleanSlug(info.category || info.discipline)}`
      const doc = {
        _id: `project-wix-${r.ID}`,
        _type: 'project',
        wixId: r.ID,
        title,
        slug: {_type: 'slug', current: slug},
        disciplines: [info.discipline],
        categories: info.category ? [info.category] : [],
        oldUrls: [...(override.dropOld ? [] : oldUrl ? [oldUrl] : []), ...(override.extraOld || [])],
        featured: FEATURED.includes(title),
      }
      if (doc.featured) doc.featuredOrder = FEATURED.indexOf(title) + 1
      const media = []
      let cover = null

      if (info.discipline === 'architecture') {
        doc.client = text(r.Client)
        doc.period = text(r['Construction Time'])
        doc.scope = text(r['Scope of Works'])
        const f = facts(r.Team)
        const get = (k) => (f.find(([a]) => a.toLowerCase() === k) || [])[1]
        doc.area = get('area') ? `${get('area').replace(/ft²/, '').trim()} ft²` : undefined
        doc.year = get('year') || firstYear(doc.period.split(/[-–]/).pop()) || firstYear(doc.period)
        const city = get('city'), country = get('country')
        if (city || country) doc.location = [city, country].filter(Boolean).join(', ')
        const skip = ['architects', 'area', 'year', 'photographs', 'manufacturers', 'city', 'country']
        doc.credits = f.filter(([a]) => !skip.includes(a.toLowerCase())).map(([a, b]) => ({_type: 'credit', _key: key(), role: ROLE_FIX[a] || sentence(a), name: b.replace(/\s+,/g, ',')}))
        const man = get('manufacturers')
        if (man) doc.credits.push({_type: 'credit', _key: key(), role: 'Materials & tools', name: man.replace(/\s+,/g, ',').replace('Cermaics', 'Ceramics')})
        const photos = gallery(r.Photographs)
        const drawings = gallery(r.Sketches).map((d) => ({...d, layout: 'drawing'}))
        media.push(...photos.slice(0, 4), ...drawings, ...photos.slice(4))
        const rich = r['Rich Content'] || ''
        const yt = /(https:\/\/(?:youtu\.be|www\.youtube\.com)\/[^"\\\s]+)/.exec(rich)
        if (yt) doc.videoUrl = yt[1]
        const ad = /(https:\/\/www\.archdaily\.com\/\d+\/[^"\\\s]+)/.exec(rich)
        if (ad) doc.links = [{_type: 'link', _key: key(), label: 'ArchDaily', url: ad[1]}]
        
        cover = wixImage(r['Featured Image'])
      } else if (info.discipline === 'experiential') {
        const ctx = text(r.Context)
        if (meaningful(ctx)) doc.story = ctx.split('\n').map(para)
        const sys = lines(r['System/Tools'])
        if (sys.length) doc.system = sys.join('\n')
        doc.role = text(r['Our Role']).replace(/Decvelopement/g, 'Development')
        const out = text(r.Outcome)
        if (meaningful(out)) doc.outcome = out
        const v = wixVideo(r.Video)
        if (v) doc.__heroVideo = v
        const img = wixImage(r.Image)
        if (img) media.push(img)
        const date = (r['Date of Event or Production'] || '').slice(0, 10)
        if (date) {
          doc.year = date.slice(0, 4)
          doc.sortDate = date
        }
        cover = v?.poster ? {url: v.poster, id: v.poster.split('/').pop(), name: 'poster.jpg'} : img
      } else {
        doc.client = text(r.Client)
        doc.year = firstYear(r['Shot in'])
        let desc = text(r['Project Description'])
        // some Wix entries put the description in the Client field
        if (doc.client.length > 90) {
          if (!meaningful(desc)) desc = doc.client
          doc.client = ''
        }
        if (meaningful(desc)) doc.story = desc.split('\n').filter(meaningful).map(para)
        media.push(...gallery(r.Photographs))
        const vid = r.Video || r.Videos || ''
        const yt = /(https:\/\/(?:youtu\.be|www\.youtube\.com)\/[^"\\\s]+)/.exec(vid + (r['Rich Content'] || ''))
        if (yt) doc.videoUrl = yt[1]
        cover = wixImage(r['Cover Image'] || r['Cover image'] || r.Cover) || wixImage(r['Featured Image'])
        if (!media.length) {
          const extra = [wixImage(r['Featured Image']), wixImage(r['Cover Image'] || r.Cover)].filter(Boolean)
          media.push(...extra.filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i))
        }
      }
      if (!doc.sortDate) doc.sortDate = doc.year ? `${doc.year}-01-01` : (r['Created Date'] || '').slice(0, 10)
      doc.__cover = cover
      doc.__media = media.map((m) => ({...m, layout: m.layout || 'auto'}))
      for (const k of Object.keys(doc)) if (!k.startsWith('__') && (doc[k] === undefined || doc[k] === '' || (Array.isArray(doc[k]) && !doc[k].length))) delete doc[k]
      docs.push(doc)
    }
  }
  return docs
}

// Pages, team and settings seeded once at import.
export function seedDocs() {
  const members = [
    ['Maruf Raihan', 'Principal'],
    ['Richie Fariha', 'Architect'],
    ['Md Rasel Al-Amin', 'Structural engineer'],
    ['Sabbir Ahmed', 'Video editor & motion designer'],
    ['Arafat Sarkar', 'Cinematographer'],
    ['Rafin Ahmed', 'Cinematographer'],
    ['Rashed Ratul', 'Manager'],
    ['Faisal Sikder', 'Office assistant'],
  ]
  const entry = (years, t) => ({_type: 'entry', _key: key(), years, text: t})
  return [
    {
      _id: 'home',
      _type: 'home',
      headline: 'Architecture, image and light.',
      intro: 'Maruf Raihan Works is a Dhaka studio working across architecture, architectural photography and experiential design. We make buildings, photograph them, and light them up.',
      servicesTitle: 'Projection, LED and immersive rooms.',
      servicesText: 'Concept, content and system design for agencies, brands and institutions. From a single wall to a full show.',
      services: [
        ['Projection mapping', 'Façades, heritage, product'],
        ['LED & laser content', 'Concerts, launches, awards'],
        ['Immersive rooms', 'Exhibitions, museums, events'],
        ['Photo & film post-production', 'Architecture, brands'],
      ].map(([name, note]) => ({_type: 'service', _key: key(), name, note})),
      __files: {reel: 'seed/reel.mp4', reelMobile: 'seed/reel-mobile.mp4', servicesVideo: 'seed/services-loop.mp4'},
      __images: {poster: 'seed/reel-poster.jpg', servicesImage: 'seed/services-still.jpg'},
    },
    {
      _id: 'studioPage',
      _type: 'studioPage',
      headline: 'Space, image and emotion.',
      bio: [
        'Maruf Raihan is a Dhaka-based architect, photographer and experiential designer, and a graduate of the Bangladesh University of Engineering and Technology (BUET). His practice spans architecture and interiors, architectural photography, audiovisual production and immersive spatial work.',
        'His photographs have documented hundreds of projects across Bangladesh, featured by ArchDaily, The Daily Star, Dot Bangladesh and The Business Standard. Through Surreal BD he creates projection-mapping shows, interactive installations and immersive environments for festivals, brands and institutions.',
        'Co-founder of Corpovisuals, Shoho Studio and Surreal BD.',
      ].map(para),
      timeline: [entry('2023–', 'Co-founder, Surreal BD'), entry('2022–', 'Founder, Maruf Raihan Works'), entry('2022–', 'Co-founder, Shoho Studio'), entry('2015–', 'Co-founder & Director, Corpovisuals'), entry('2012–16', 'Partner, Studio Biporit')],
      education: [entry('2012–17', 'B.Arch, Bangladesh University of Engineering and Technology'), entry('2011', 'HSC, Notre Dame College, Dhaka'), entry('2009', 'SSC, Government Laboratory High School, Dhaka')],
      press: ['ArchDaily', 'The Daily Star', 'Dot Bangladesh', 'The Business Standard'],
      __images: {portrait: 'seed/portrait.jpg'},
    },
    {_id: 'settings', _type: 'settings', email: 'mail@marufraihan.works', phone: '+880 1671 034081', address: 'Flat B4, House 06, Road 07\nBlock C, Niketon, Dhaka 1212', instagram: 'https://www.instagram.com/marufraihan.works', sister: 'Surreal BD, Corpovisuals, Shoho Studio', seoDescription: 'Maruf Raihan Works is a Dhaka studio for architecture, architectural photography and experiential design.'},
    ...members.map(([name, role], i) => ({_id: `member-${cleanSlug(name)}`, _type: 'member', name, role, order: i + 1, ...(i === 0 ? {__images: {photo: 'seed/portrait.jpg'}} : {})})),
  ]
}

if (process.argv[1] && process.argv[1].endsWith('transform.mjs')) {
  const d = loadProjects()
  const by = {}
  for (const x of d) by[x.disciplines[0]] = (by[x.disciplines[0]] || 0) + 1
  console.log(d.length, 'projects', by, 'media', d.reduce((a, x) => a + x.__media.length, 0))
  const slugs = d.map((x) => x.slug.current)
  console.log('duplicate slugs:', slugs.filter((s, i) => slugs.indexOf(s) !== i))
  console.log(JSON.stringify(d.find((x) => x.title === 'Hawladar Bari'), (k, v) => (k === '__media' ? `${v.length} items` : v), 1).slice(0, 2500))
  console.log(JSON.stringify(d.find((x) => x.title === 'Immersive for Art and Music Fest'), null, 1).slice(0, 1500))
}
