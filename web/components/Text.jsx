import {PortableText} from '@portabletext/react'
import Img from './Img'

const components = {
  types: {image: ({value}) => <figure className="pt-img"><Img image={value} sizes="(max-width: 760px) 100vw, 60vw" />{value.caption && <figcaption className="small muted">{value.caption}</figcaption>}</figure>},
  marks: {link: ({value, children}) => <a href={value?.href} rel="noopener">{children}</a>},
}
export default function Text({value, className}) {
  if (!value?.length) return null
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  )
}
