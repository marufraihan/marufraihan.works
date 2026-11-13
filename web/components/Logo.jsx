export function Mark(props) {
  return (
    <svg viewBox="80 45 395 265" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round">
        <path d="M92 230 V143 H157 V58 H268" />
        <path d="M222 132 A71 71 0 1 1 322 232" />
        <path d="M367 180 H437" />
        <path d="M455 128 V215 H392 V297 H282" />
      </g>
      <circle cx="437" cy="282" r="19" fill="currentColor" />
    </svg>
  )
}
export default function Logo() {
  return (
    <a className="logo" href="/" aria-label="Maruf Raihan Works, home">
      <Mark />
      <span>MARUFRAIHAN.WORKS</span>
    </a>
  )
}
