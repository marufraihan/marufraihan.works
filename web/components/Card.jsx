import Img from './Img'
import {discLabel} from '@/lib/data'

export default function Card({p, ratio = 4 / 3, className = '', sizes, showClient = true}) {
  const meta = (p.categories || []).join(', ') || (p.disciplines || []).map(discLabel).join(', ')
  return (
    <a className={`card ${className}`} href={`/work/${p.slug}/`}>
      <div className="ph" style={{aspectRatio: ratio}}>
        <Img image={p.cover} ratio={ratio} sizes={sizes} alt={p.title} />
      </div>
      <div className="cap">
        <b>{p.title}</b>
        <span className="small muted">{meta}</span>
      </div>
      {showClient && p.client && <span className="muted client" style={{fontSize: 15, marginTop: -6}}>{p.client}</span>}
    </a>
  )
}
