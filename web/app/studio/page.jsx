import Header from '@/components/Header'
import Img from '@/components/Img'
import Text from '@/components/Text'
import ContactForm from '@/components/ContactForm'
import {getStudio, getSettings} from '@/lib/data'

export const metadata = {title: 'Studio', description: 'Maruf Raihan Works: architecture, photography and experiential design from Dhaka. Team and contact.'}

export default async function Studio() {
  const [{page = {}, team = []}, s] = await Promise.all([getStudio(), getSettings()])
  return (
    <>
      <Header current="Studio" settings={s} />
      <main id="main">
        <div className="wrap st-top">
          <div className="ph">
            <Img image={page.portrait} ratio={1} eager alt="Maruf Raihan" sizes="(max-width: 820px) 100vw, 40vw" />
          </div>
          <div>
            <div className="small muted" style={{marginBottom: 22}}>
              Studio
            </div>
            <h1>{page.headline}</h1>
            <Text value={page.bio} />
          </div>
        </div>

        {(page.timeline?.length > 0 || page.education?.length > 0) && (
          <div className="wrap">
            <div className="cols">
              {page.timeline?.length > 0 && (
                <div>
                  <h2>Practice</h2>
                  <ul className="tl">
                    {page.timeline.map((e) => (
                      <li key={e._key}>
                        <span className="small muted">{e.years}</span>
                        <span>{e.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                {page.education?.length > 0 && (
                  <>
                    <h2>Education</h2>
                    <ul className="tl">
                      {page.education.map((e) => (
                        <li key={e._key}>
                          <span className="small muted">{e.years}</span>
                          <span>{e.text}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {page.press?.length > 0 && (
                  <>
                    <h2>Featured in</h2>
                    <p style={{margin: 0, fontSize: 15}}>{page.press.join(', ')}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {team.length > 0 && (
          <div className="wrap" style={{paddingBlock: '40px 80px'}}>
            <div className="shead">
              <h2>Team</h2>
              <span className="small muted">{team.length} people</span>
            </div>
            <div className="team">
              {team.map((m) => (
                <div key={m._id}>
                  <div className="ph">{m.photo ? <Img image={m.photo} ratio={4 / 5} sizes="(max-width: 760px) 50vw, 20vw" alt={m.name} /> : null}</div>
                  <b>{m.name}</b>
                  <span className="muted">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="wrap" id="contact" style={{paddingBlock: '40px 120px', scrollMarginTop: 20}}>
          <div className="shead">
            <h2>Contact</h2>
            <span className="small muted">Architecture, photography, experiential, film</span>
          </div>
          <div className="story" style={{paddingBlock: '20px 0'}}>
            <dl className="facts">
              {s.email && (
                <>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                  </dd>
                </>
              )}
              {s.phone && (
                <>
                  <dt>Phone</dt>
                  <dd>{s.phone}</dd>
                </>
              )}
              {s.address && (
                <>
                  <dt>Studio</dt>
                  <dd style={{whiteSpace: 'pre-line'}}>{s.address}</dd>
                </>
              )}
            </dl>
            <ContactForm email={s.email} />
          </div>
        </div>
      </main>
    </>
  )
}
