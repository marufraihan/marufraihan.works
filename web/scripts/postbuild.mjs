// After `next build`: writes Cloudflare _redirects, _headers, sitemap.xml, robots.txt, and copies the CMS into /admin.
import fs from 'node:fs'
import path from 'node:path'
import {getRedirectData} from '../lib/data.js'

const OUT = path.resolve('out')
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://marufraihan.works').replace(/\/$/, '')

const PAGES = [
  ['/photography', '/work/?discipline=photography'],
  ['/architecture', '/work/?discipline=architecture'],
  ['/videos', '/work/?discipline=film'],
  ['/experiential', '/work/?discipline=experiential'],
  ['/experiential-portfolio', '/work/?discipline=experiential'],
  ['/about', '/studio/'],
  ['/work-with-us', '/studio/'],
  ['/partnercompanies', '/work/'],
  ['/projects-1', '/work/'],
  ['/projects-2', '/work/'],
  ['/portfolio-4', '/work/'],
]
const FALLBACKS = [
  ['/architectural-project/*', '/work/?discipline=architecture'],
  ['/experiential-portfolio/*', '/work/?discipline=experiential'],
  ['/photography-residences/*', '/work/?discipline=photography&category=Residences'],
  ['/photography-commercials-retails/*', '/work/?discipline=photography&category=Commercial+%26+Retail'],
  ['/photography-public-places/*', '/work/?discipline=photography&category=Public+Places'],
  ['/photography-institutes/*', '/work/?discipline=photography&category=Institutes'],
  ['/photography-restaurants-and-resort/*', '/work/?discipline=photography&category=Restaurants+%26+Resorts'],
  ['/photography-special-projects/*', '/work/?discipline=photography&category=Special+Projects'],
  ['/2nd-photo-set-1/*', '/work/?discipline=photography'],
]

// Old Wix links can arrive encoded or not; emit each spelling once.
function variants(p) {
  const out = new Set()
  let dec = p
  try {
    dec = decodeURIComponent(p)
  } catch {}
  const enc = encodeURI(dec).replace(/'/g, '%27')
  for (const v of [p, dec, enc, encodeURI(dec)]) {
    if (!v || /\s/.test(v)) continue
    out.add(v.replace(/\/$/, ''))
  }
  return [...out]
}

const data = await getRedirectData()
const lines = []
const seen = new Set()
const add = (from, to) => {
  for (const v of variants(from)) {
    for (const f of [v, v + '/']) {
      if (seen.has(f) || f === to) continue
      seen.add(f)
      lines.push(`${f} ${to} 301`)
    }
  }
}
for (const p of data.projects || []) for (const u of p.oldUrls || []) add(u, `/work/${p.slug}/`)
for (const r of data.extra || []) if (r.from && r.to) add(r.from, r.to)
for (const [f, t] of PAGES) add(f, t)
const dynamic = FALLBACKS.map(([f, t]) => `${f} ${t} 302`)
const studio = ['/admin /admin/ 301', '/admin/* /admin/index.html 200']
fs.writeFileSync(path.join(OUT, '_redirects'), [...lines.slice(0, 1900), ...studio, ...dynamic].join('\n') + '\n')
if (lines.length > 1900) console.warn(`! ${lines.length} redirects; only 1900 written (Cloudflare limit).`)

fs.writeFileSync(
  path.join(OUT, '_headers'),
  `/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`,
)

// sitemap from the exported html files
const urls = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) {
      if (['_next', 'admin', 'fonts', '_', 'preview', '_fx'].includes(e.name)) continue
      walk(p)
    } else if (e.name === 'index.html') {
      const rel = '/' + path.relative(OUT, path.dirname(p)).replace(/\\/g, '/')
      if (!rel.includes('/_')) urls.push(rel === '/' ? '/' : rel + '/')
    }
  }
})(OUT)
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.sort().map((u) => `  <url><loc>${SITE}${u.replace(/\/\/$/, '/')}</loc></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /preview/\nSitemap: ${SITE}/sitemap.xml\n`)

// the CMS (built by ../studio) lives at /admin
const studioDist = path.resolve('../studio/dist')
if (fs.existsSync(studioDist)) {
  fs.cpSync(studioDist, path.join(OUT, 'admin'), {recursive: true})
  console.log('Copied CMS to /admin')
} else console.warn('! CMS not built; /admin will be missing')
// placeholder pages created when a list was empty
for (const d of ['work/_', 'journal/_']) fs.rmSync(path.join(OUT, d), {recursive: true, force: true})
console.log(`postbuild: ${lines.length} redirects, ${urls.length} pages in sitemap`)
