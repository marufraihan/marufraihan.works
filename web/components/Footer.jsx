export default function Footer({settings: s = {}}) {
  const socials = [
    ['Instagram', s.instagram],
    ['Facebook', s.facebook],
    ['YouTube', s.youtube],
  ].filter(([, u]) => u)
  return (
    <footer className="site dark">
      <div className="small muted">Start a project</div>
      {s.email && (
        <a className="big" href={`mailto:${s.email}`}>
          {s.email}
        </a>
      )}
      <div className="fgrid">
        {s.address && (
          <div>
            <span className="small muted">Studio</span>
            <p style={{whiteSpace: 'pre-line'}}>{s.address}</p>
          </div>
        )}
        {s.phone && (
          <div>
            <span className="small muted">Phone</span>
            <p>
              <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>
            </p>
          </div>
        )}
        {socials.length > 0 && (
          <div>
            <span className="small muted">Follow</span>
            <p>
              {socials.map(([n, u], i) => (
                <span key={n}>
                  {i ? ', ' : ''}
                  <a href={u} rel="noopener" target="_blank">
                    {n}
                  </a>
                </span>
              ))}
            </p>
          </div>
        )}
        {s.sister && (
          <div>
            <span className="small muted">Sister studios</span>
            <p>{s.sister}</p>
          </div>
        )}
      </div>
      <div className="fbot small muted">
        <span>© {new Date().getFullYear()} Maruf Raihan Works</span>
        <span>Dhaka, Bangladesh</span>
      </div>
    </footer>
  )
}
