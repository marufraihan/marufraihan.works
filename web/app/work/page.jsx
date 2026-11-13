import Header from '@/components/Header'
import WorkIndex from '@/components/WorkIndex'
import {getProjects, getSettings} from '@/lib/data'

export const metadata = {title: 'Work', description: 'Architecture, architectural photography, experiential design and film by Maruf Raihan Works.'}

export default async function Work() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()])
  return (
    <>
      <Header current="Work" settings={settings} />
      <main id="main" className="wrap">
        <div className="wtop">
          <h1>Work</h1>
          <p className="muted" style={{margin: 0, maxWidth: '36ch'}}>
            Architecture, photography, experiential design and film.
          </p>
        </div>
        <WorkIndex projects={projects} />
        <div style={{height: 120}} />
      </main>
    </>
  )
}
