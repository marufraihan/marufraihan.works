// Stops the page behind an overlay from scrolling. Nested callers share one lock.
let n = 0
export function lockScroll() {
  n++
  document.documentElement.style.overflow = 'hidden'
  let done = false
  return () => {
    if (done) return
    done = true
    n = Math.max(0, n - 1)
    if (!n) document.documentElement.style.overflow = ''
  }
}
