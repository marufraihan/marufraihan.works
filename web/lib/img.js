import {createImageUrlBuilder} from '@sanity/image-url'

const builder = createImageUrlBuilder({projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wgudx0eu', dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'})

const WIDTHS = [480, 800, 1200, 1600, 2200]

// src for one width; handles Sanity images and plain URLs (local test data)
export function imgUrl(image, w, h) {
  if (!image) return ''
  if (!image.asset?._ref && image.url) return image.url
  let b = builder.image(image).width(w).auto('format').quality(78).fit('max')
  if (h) b = b.height(h).fit('crop')
  return b.url()
}
export function srcSet(image, ratio) {
  if (!image || (!image.asset?._ref && image.url)) return undefined
  const max = image.w || 2200
  return WIDTHS.filter((w) => w <= Math.max(max, 480))
    .map((w) => `${imgUrl(image, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`)
    .join(', ')
}
export const aspect = (image, fallback = 1.5) => (image?.w && image?.h ? image.w / image.h : fallback)
