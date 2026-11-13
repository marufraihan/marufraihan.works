import {imgUrl, srcSet} from '@/lib/img'

// ratio: crop to this width/height ratio; omitted = natural shape
export default function Img({image, alt = '', ratio, sizes = '100vw', eager = false, className, contain = false}) {
  if (!image) return <div className={'ph-empty ' + (className || '')} style={ratio ? {aspectRatio: ratio} : undefined} />
  const r = ratio || (image.w && image.h ? image.w / image.h : undefined)
  const crop = ratio && !contain ? ratio : undefined
  return (
    <img
      className={className}
      src={imgUrl(image, 1600, crop ? Math.round(1600 / crop) : undefined)}
      srcSet={srcSet(image, crop)}
      sizes={sizes}
      alt={alt || image.alt || ''}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      style={{aspectRatio: r, objectFit: contain ? 'contain' : 'cover', backgroundImage: image.lqip ? `url(${image.lqip})` : undefined, backgroundSize: 'cover'}}
    />
  )
}
