'use client'
import {useEffect, useState} from 'react'
import {createClient} from '@sanity/client'
import {enableVisualEditing} from '@sanity/visual-editing'
import {useLiveMode} from '@/lib/loader'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wgudx0eu',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  stega: {enabled: true, studioUrl: '/admin'},
})

function Live() {
  useLiveMode({client})
  useEffect(() => enableVisualEditing(), [])
  return null
}

// Only active when the site is shown inside the CMS.
export default function VisualEditing() {
  const [inCms, setInCms] = useState(false)
  useEffect(() => {
    try {
      setInCms(window.self !== window.top || !!window.opener)
    } catch {
      setInCms(true)
    }
  }, [])
  return inCms ? <Live /> : null
}
