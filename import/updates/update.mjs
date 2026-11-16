// Content update (16 Nov 2026): homepage Services section covers all three practices.
// Writes to the published homepage and to any open draft, so the next Publish keeps it.
import {createClient} from '@sanity/client'

const client = createClient({projectId: process.env.SANITY_PROJECT_ID, dataset: 'production', token: process.env.SANITY_WRITE_TOKEN, apiVersion: '2025-01-01', useCdn: false})
process.on('unhandledRejection', (e) => {
  console.log(`::error title=Content update::${String(e?.message || e).slice(0, 400)}`)
  process.exit(1)
})

const services = [
  ['arch', 'Architecture & interiors', 'Homes, workplaces, retail', '/work/?discipline=architecture'],
  ['photo', 'Photography & film', 'Architecture, interiors, brand films', '/work/?discipline=photography'],
  ['exp', 'Experiential design', 'Projection mapping, LED, immersive rooms', '/work/?discipline=experiential'],
].map(([k, name, note, link]) => ({_type: 'service', _key: k, name, note, link}))

const patch = {
  servicesLabel: 'Services',
  servicesTitle: 'Three practices, one studio.',
  servicesText: 'We design buildings and interiors, photograph and film the built world, and turn spaces into immersive experiences. Clients come to us for one practice, or for all three together.',
  services,
  servicesButton: 'Start a project',
}
const ids = await client.fetch('*[_id in ["home", "drafts.home"]]._id')
const tx = client.transaction()
for (const id of ids) tx.patch(id, (p) => p.set(patch))
await tx.commit()
console.log('Homepage services updated:', ids.join(', '))
