'use client'
import {useEffect, useState} from 'react'
import {useQuery} from '@/lib/loader'
import {PROJECT_QUERY} from '@/lib/data'
import ProjectView from './ProjectView'

// Live, unpublished view of a project for the CMS "Edit on page" tool: /preview/?slug=hawladar-bari
export default function PreviewProject() {
  const [slug, setSlug] = useState(null)
  useEffect(() => setSlug(new URL(window.location.href).searchParams.get('slug') || ''), [])
  const {data, loading} = useQuery(PROJECT_QUERY, {slug: slug || ''}, {initial: undefined})
  if (slug === null) return null
  if (!data)
    return (
      <main className="wrap" style={{padding: '120px 0', minHeight: '70vh'}}>
        <p className="muted">{loading ? 'Loading preview…' : 'Open this page from the CMS (Edit on page) to see a live preview.'}</p>
      </main>
    )
  return <ProjectView p={data} />
}
