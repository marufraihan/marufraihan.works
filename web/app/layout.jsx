import './globals.css'
import Footer from '@/components/Footer'
import Fade from '@/components/Fade'
import VisualEditing from '@/components/VisualEditing'
import Lightbox from '@/components/Lightbox'
import ProjectOverlay from '@/components/ProjectOverlay'
import {getSettings} from '@/lib/data'

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://marufraihan.works'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    metadataBase: new URL(SITE),
    title: {default: 'MarufRaihan.Works', template: '%s · MarufRaihan.Works'},
    description: s.seoDescription || 'Architecture, architectural photography and experiential design from Dhaka.',
    openGraph: {siteName: 'MarufRaihan.Works', type: 'website'},
    icons: {icon: '/favicon.svg'},
  }
}

export default async function RootLayout({children}) {
  const settings = await getSettings()
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
        <Footer settings={settings} />
        <Fade />
        <ProjectOverlay />
        <Lightbox />
        <VisualEditing />
      </body>
    </html>
  )
}
