'use client'
import {useEffect} from 'react'

// Reveals .fade elements as they scroll into view, including ones added later.
export default function Fade() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.fade').forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), {threshold: 0.08, rootMargin: '0px 0px -4% 0px'})
    const scan = () => document.querySelectorAll('.fade:not(.in)').forEach((e) => io.observe(e))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, {childList: true, subtree: true})
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
  return null
}
