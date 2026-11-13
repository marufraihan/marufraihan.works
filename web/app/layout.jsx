import './globals.css'
import Footer from '@/components/Footer'
import Fade from '@/components/Fade'
import VisualEditing from '@/components/VisualEditing'
import {getSettings} from '@/lib/data'

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://marufraihan.works'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    metadataBase: new URL(SITE),
    title: {default: 'Maruf Raihan Works', template: '%s · Maruf Raihan Works'},
    description: s.seoDescription || 'Architecture, architectural photography and experiential design from Dhaka.',
    openGraph: {siteName: 'Maruf Raihan Works', type: 'website'},
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
        <VisualEditing />
      </body>
    </html>
  )
}
