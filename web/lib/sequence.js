// Turns a project's media list into a rhythm of rows: full-width, pairs, drawings, indents.
const portrait = (m) => m.w && m.h && m.h > m.w * 1.05
export function sequence(media = []) {
  const rows = []
  const items = media.filter((m) => m && (m._type === 'loop' ? m.url : m.asset || m.url))
  let fullCount = 0
  for (let i = 0; i < items.length; i++) {
    const m = items[i]
    const lay = m.layout || 'auto'
    if (m._type === 'loop') {
      rows.push({kind: 'loop', items: [m]})
      continue
    }
    if (lay === 'drawing') {
      const group = [m]
      while (items[i + 1] && items[i + 1].layout === 'drawing' && group.length < 2) group.push(items[++i])
      rows.push({kind: 'drawings', items: group})
      continue
    }
    if (lay === 'full') {
      rows.push({kind: 'full', items: [m]})
      continue
    }
    if (lay === 'half' || (lay === 'auto' && portrait(m))) {
      const n = items[i + 1]
      if (n && n._type !== 'loop' && (n.layout === 'half' || (n.layout || 'auto') === 'auto') && (lay === 'half' || portrait(n))) {
        rows.push({kind: 'pair', items: [m, items[++i]]})
      } else rows.push({kind: 'narrow', items: [m]})
      continue
    }
    // landscape auto: alternate full width and indented
    rows.push({kind: fullCount++ % 3 === 2 ? 'indent' : 'full', items: [m]})
  }
  return rows
}
export function embedUrl(url) {
  if (!url) return null
  const yt = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(url)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`
  const vm = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?dnt=1`
  return null
}
