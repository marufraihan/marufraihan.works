import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import project from './schemas/project.js'
import {journal, member, home, studioPage, settings, redirect} from './schemas/others.js'
import {structure, SINGLETONS} from './structure.js'
import {TableTool} from './tools/TableTool.jsx'
import {locations} from './locations.js'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'REPLACE_ME'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const siteUrl = process.env.SANITY_STUDIO_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://marufraihan.works')

const TableIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 25 25" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <rect x="4.5" y="5.5" width="16" height="14" />
    <path d="M4.5 10.5h16M4.5 15h16M10 5.5v14" />
  </svg>
)

export default defineConfig({
  name: 'default',
  title: 'Maruf Raihan Works',
  basePath: '/admin',
  projectId,
  dataset,
  plugins: [
    structureTool({structure, title: 'Content'}),
    presentationTool({
      title: 'Edit on page',
      previewUrl: {origin: siteUrl, preview: '/', previewMode: undefined},
      resolve: {locations},
    }),
    visionTool({title: 'Query', defaultApiVersion: '2025-01-01'}),
  ],
  tools: (prev) => [...prev.slice(0, 1), {name: 'table', title: 'Table', icon: TableIcon, component: TableTool}, ...prev.slice(1)],
  schema: {
    types: [project, journal, member, home, studioPage, settings, redirect],
    templates: (t) => t.filter(({schemaType}) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    actions: (input, ctx) => (SINGLETONS.includes(ctx.schemaType) ? input.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : input),
    newDocumentOptions: (prev) => prev.filter((i) => !SINGLETONS.includes(i.templateId)),
  },
})
