'use client'
import {useEffect, useRef} from 'react'

// Muted autoplay loop. iOS needs muted set as a property before play().
export default function Video({src, poster, className, label}) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {threshold: 0.1})
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  if (!src) return null
  return <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} />
}
