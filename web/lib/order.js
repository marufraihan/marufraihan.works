// Mixes the project list so one discipline never runs on and on.
// Default round: 3 photography, 1 experiential, 1 architecture, 1 film.
// A discipline that runs out is skipped, and the rest keep going.
// Inside each discipline the incoming order is kept (newest first).
export const PATTERN = ['photography', 'photography', 'photography', 'experiential', 'architecture', 'film']

export function interleave(projects = [], pattern = PATTERN) {
  const buckets = new Map()
  for (const p of projects) {
    const d = (p.disciplines || [])[0] || 'other'
    if (!buckets.has(d)) buckets.set(d, [])
    buckets.get(d).push(p)
  }
  const out = []
  let i = 0
  while (out.length < projects.length) {
    let placed = false
    for (let step = 0; step < pattern.length; step++) {
      const b = buckets.get(pattern[(i + step) % pattern.length])
      if (b && b.length) {
        out.push(b.shift())
        i += step + 1
        placed = true
        break
      }
    }
    if (!placed) break // only disciplines outside the pattern are left
  }
  for (const b of buckets.values()) out.push(...b)
  return out
}
