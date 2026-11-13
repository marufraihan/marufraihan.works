// Imports the Wix CSV exports into Sanity, downloading every photo and video from Wix.
// Runs in GitHub Actions ("Import from Wix" workflow). Safe to run again: finished projects are skipped,
// and Sanity never stores the same file twice.
//
// Env: SANITY_PROJECT_ID, SANITY_DATASET (default production), SANITY_WRITE_TOKEN
// Flags: --dry (no network, just a report), --force (re-import projects that already exist), --only "Title"
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'
import {loadProjects, seedDocs} from './transform.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const FORCE = args.includes('--force')
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
const HERE = path.dirname(new URL(import.meta.url).pathname)
const MAX_VIDEO_MB = 25
const OUT = path.join(HERE, 'out')
fs.mkdirSync(path.join(OUT, 'videos'), {recursive: true})

const projects = loadProjects().filter((p) => !ONLY || p.title === ONLY)
const seeds = seedDocs()

if (DRY) {
  const media = projects.reduce((a, p) => a + p.__media.length, 0)
  console.log(`Dry run: ${projects.length} projects, ${media} photos, ${projects.filter((p) => p.__heroVideo).length} videos, ${seeds.length} pages/team entries.`)
  process.exit(0)
}

const {SANITY_PROJECT_ID, SANITY_DATASET = 'production', SANITY_WRITE_TOKEN} = process.env
if (!SANITY_PROJECT_ID || !SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN.')
  process.exit(1)
}
const client = createClient({projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, token: SANITY_WRITE_TOKEN, apiVersion: '2025-01-01', useCdn: false})

const log = []
const note = (s) => {
  console.log(s)
  log.push(s)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function download(urls) {
  for (const url of [].concat(urls).filter(Boolean)) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 (site migration)'}})
        if (res.status === 404 || res.status === 403) break
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return {buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '', url}
      } catch (e) {
        if (attempt === 3) note(`  ! download failed ${url}: ${e.message}`)
        else await sleep(1500 * attempt)
      }
    }
  }
  return null
}

const assetCache = new Map()
async function uploadImage(m) {
  if (assetCache.has(m.url)) return assetCache.get(m.url)
  const file = await download(m.url)
  if (!file) return null
  const asset = await client.assets.upload('image', file.buf, {filename: (m.name || m.id).replace(/[\\/]/g, '-'), source: {id: m.id, name: 'wix', url: m.url}})
  assetCache.set(m.url, asset._id)
  return asset._id
}

async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({length: n}, async () => {
      while (i < items.length) {
        const k = i++
        try {
          out[k] = await fn(items[k], k)
        } catch (e) {
          note(`  ! ${e.message}`)
          out[k] = null
        }
      }
    }),
  )
  return out
}

const keyOf = (s) => s.replace(/[^a-zA-Z0-9]/g, '').slice(-12) || Math.random().toString(36).slice(2, 10)

async function importProject(p, idx) {
  const exists = await client.fetch('*[_id == $id][0]{_id, "n": count(media)}', {id: p._id})
  if (exists && exists.n > 0 && !FORCE) {
    console.log(`[${idx + 1}/${projects.length}] ${p.title}: already imported, skipped`)
    return
  }
  console.log(`[${idx + 1}/${projects.length}] ${p.title}: ${p.__media.length} photos`)
  const {__media, __cover, __heroVideo, ...doc} = p
  const ids = await pool(__media, 6, uploadImage)
  doc.media = __media
    .map((m, i) => (ids[i] ? {_type: 'photo', _key: keyOf(m.id) + i, asset: {_type: 'reference', _ref: ids[i]}, layout: m.layout, ...(m.caption ? {caption: m.caption} : {})} : null))
    .filter(Boolean)
  const missing = __media.length - doc.media.length
  if (missing) note(`  ! ${p.title}: ${missing} photo(s) could not be downloaded`)
  if (__cover) {
    const c = await uploadImage(__cover)
    if (c) doc.cover = {_type: 'image', asset: {_type: 'reference', _ref: c}}
  }
  if (__heroVideo) {
    const v = await download([__heroVideo.url, __heroVideo.fallback, __heroVideo.url.replace('1080p', '480p')])
    if (!v) note(`  ! ${p.title}: video not downloadable from Wix (${__heroVideo.name}). Upload it in the CMS.`)
    else if (v.buf.length > MAX_VIDEO_MB * 1e6) {
      const f = path.join(OUT, 'videos', `${doc.slug.current}.mp4`)
      fs.writeFileSync(f, v.buf)
      note(`  ${p.title}: video is ${(v.buf.length / 1e6).toFixed(0)} MB, saved to the download package instead (put it on YouTube/Vimeo).`)
    } else {
      const asset = await client.assets.upload('file', v.buf, {filename: `${doc.slug.current}.mp4`, contentType: 'video/mp4', source: {id: __heroVideo.id, name: 'wix', url: v.url}})
      doc.heroVideo = {_type: 'file', asset: {_type: 'reference', _ref: asset._id}}
    }
  }
  await client.createOrReplace(doc)
}

async function importSeeds() {
  for (const s of seeds) {
    const exists = await client.fetch('*[_id == $id][0]._id', {id: s._id})
    if (exists && !FORCE) continue
    const {__files = {}, __images = {}, ...doc} = s
    for (const [field, file] of Object.entries(__images)) {
      const a = await client.assets.upload('image', fs.readFileSync(path.join(HERE, file)), {filename: path.basename(file)})
      doc[field] = {_type: 'image', asset: {_type: 'reference', _ref: a._id}}
    }
    for (const [field, file] of Object.entries(__files)) {
      const a = await client.assets.upload('file', fs.readFileSync(path.join(HERE, file)), {filename: path.basename(file), contentType: 'video/mp4'})
      doc[field] = {_type: 'file', asset: {_type: 'reference', _ref: a._id}}
    }
    await client.createOrReplace(doc)
    console.log(`Seeded ${doc._type} ${doc._id}`)
  }
}

const t0 = Date.now()
if (!ONLY) await importSeeds()
for (let i = 0; i < projects.length; i++) {
  try {
    await importProject(projects[i], i)
  } catch (e) {
    note(`  ! ${projects[i].title} failed: ${e.message}`)
  }
}
const summary = `Finished in ${Math.round((Date.now() - t0) / 60000)} min. ${log.filter((l) => l.includes('!')).length} problem(s).`
note(summary)
fs.writeFileSync(path.join(OUT, 'import-report.txt'), log.join('\n') + '\n')
