// The overlay and the lightbox each add their own browser-history entry, so the Back button
// closes them instead of leaving the page. Next.js patches window.history.pushState and reloads
// the page when Back lands on an entry it did not create, so these entries go through the native
// methods and a single capture listener keeps Next out of the way.
const proto = typeof History !== 'undefined' ? History.prototype : null

export const push = (state, url) => proto.pushState.call(window.history, state, '', url)
export const replace = (state, url) => proto.replaceState.call(window.history, state, '', url)

const subs = new Set()
let installed = false
export function onPop(fn) {
  if (!installed) {
    installed = true
    window.addEventListener(
      'popstate',
      (e) => {
        subs.forEach((f) => f(e))
        if (e.state && e.state.mrw) e.stopImmediatePropagation()
      },
      true,
    )
  }
  subs.add(fn)
  return () => subs.delete(fn)
}
