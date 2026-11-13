'use client'
import {useEffect} from 'react'

export default function Fade() {
  useEffect(() => {
    const els = [...document.querySelectorAll('.fade:not(.in)')]
    if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'))
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), {threshold: 0.1})
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
  return null
}
