import Header from '@/components/Header'

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="wrap" style={{minHeight: '60vh', paddingTop: 80}}>
        <h1 style={{fontWeight: 400, fontSize: 'clamp(48px,8vw,120px)', letterSpacing: '-.04em', margin: 0}}>Not found</h1>
        <p className="muted">This page has moved or no longer exists.</p>
        <p>
          <a className="arrow" href="/work/">
            See all work →
          </a>
        </p>
      </main>
    </>
  )
}
