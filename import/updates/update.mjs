// One-time content update (Nov 2026): Featured-in articles and team photos.
// Runs from the "Content update" workflow. Safe to run again.
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const client = createClient({projectId: process.env.SANITY_PROJECT_ID, dataset: 'production', token: process.env.SANITY_WRITE_TOKEN, apiVersion: '2025-01-01', useCdn: false})
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)

const ARTICLES = [
  ['ArchDaily', 'Hawladar House / Maruf Raihan.Works', '2024', 'https://www.archdaily.com/1012574/hawladar-bari-house-maruf-raihan-works'],
  ['The Business Standard', 'A home rooted in memory and rural design: The story of Hawladar Bari', '2025', 'https://www.tbsnews.net/features/habitat/home-rooted-memory-and-rural-design-story-hawladar-bari-1188786'],
  ['Archello', 'Hawladar House', '', 'https://archello.com/project/hawladar-house'],
  ['ArchiDiaries', 'Hawladar Bari | Maruf Raihan.Works', '', 'https://archidiaries.com/projects/hawladar-bari-maruf-raihan-works/'],
  ['ArchitectureLive!', 'Hawladar Bari, Shibchar, Bangladesh, by Maruf Raihan.Works', '', 'https://architecture.live/hawladar-bari-bangladesh-maruf-raihan-works/'],
  ['UNI Journal', 'Traditional Bengali Architecture: A Modern Interpretation at Hawladar House', '', 'https://uni.xyz/journal/traditional-bengali-architecture-a-moder'],
  ['Showcase', 'Bonded by Nature', '', 'https://showcase.com.bd/?p=22093'],
]

// photo file -> name in the CMS (and role for anyone new)
const TEAM = [
  ['md-rasel-al-amin.jpg', 'Md Rasel Al-Amin'],
  ['richie-fariha.jpg', 'Richie Fariha'],
  ['arafat-sarkar.jpg', 'Arafat Sarkar'],
  ['faisal-sikder.jpg', 'Faisal Sikder'],
  ['labonno-kumar.jpg', 'Labonno Kumar', ''],
  ['rafin-ahmed.jpg', 'Rafin Ahmed'],
  ['rashed-ratul.jpg', 'Rashed Ratul'],
  ['sabbir-ahmed.jpg', 'Sabbir Ahmed'],
]

async function patchBoth(id, fn) {
  const ids = await client.fetch('*[_id in [$id, "drafts." + $id]]._id', {id})
  const tx = client.transaction()
  for (const i of ids) tx.patch(i, fn)
  if (ids.length) await tx.commit()
  return ids.length
}

const hb = await client.fetch('*[_type == "project" && slug.current == "hawladar-bari"][0]._id')
const pressLinks = ARTICLES.map(([publication, title, year, url]) => ({_type: 'article', _key: key(publication), publication, title, ...(year ? {year} : {}), url, ...(hb ? {project: {_type: 'reference', _ref: hb}} : {})}))
await client.createIfNotExists({_id: 'studioPage', _type: 'studioPage'})
const page = await client.fetch('*[_id == "studioPage"][0]{pressLinks}')
const existing = (page?.pressLinks || []).filter((a) => !pressLinks.some((n) => n._key === a._key))
await patchBoth('studioPage', (p) => p.set({pressLinks: [...pressLinks, ...existing]}))
console.log(`Featured in: ${pressLinks.length} articles`)

if (hb) {
  const links = ARTICLES.map(([publication, , , url]) => ({_type: 'link', _key: key(publication), label: publication, url}))
  await patchBoth(hb, (p) => p.set({links}))
  console.log('Hawladar Bari: press links set')
}

const maxOrder = (await client.fetch('max(*[_type == "member"].order)')) || 8
let next = maxOrder
for (const [file, name, role] of TEAM) {
  const asset = await client.assets.upload('image', fs.readFileSync(path.join(HERE, 'updates', 'team', file)), {filename: file})
  const photo = {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
  let id = await client.fetch('*[_type == "member" && lower(name) == lower($name) && !(_id in path("drafts.**"))][0]._id', {name})
  if (!id) {
    id = `member-${file.replace('.jpg', '')}`
    await client.createIfNotExists({_id: id, _type: 'member', name, role: role || '', order: ++next})
    console.log(`Added new team member: ${name}`)
  }
  await patchBoth(id, (p) => p.set({photo}))
  console.log(`Photo set: ${name}`)
}
