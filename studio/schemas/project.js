import {defineType, defineField, defineArrayMember} from 'sanity'
import {DISCIPLINES, CATEGORIES} from './options.js'

const media = defineArrayMember({
  type: 'image',
  name: 'photo',
  title: 'Photo or drawing',
  options: {hotspot: true},
  fields: [
    defineField({name: 'caption', type: 'string', title: 'Caption'}),
    defineField({name: 'alt', type: 'string', title: 'Description for screen readers', description: 'What the photo shows, in a few words.'}),
    defineField({
      name: 'layout',
      type: 'string',
      title: 'Layout',
      initialValue: 'auto',
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: 'Full width', value: 'full'},
          {title: 'Half (pairs with the next photo)', value: 'half'},
          {title: 'Drawing (shown on white, not cropped)', value: 'drawing'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
  ],
  preview: {select: {media: 'asset', title: 'caption', layout: 'layout'}, prepare: ({media, title, layout}) => ({media, title: title || ' ', subtitle: layout && layout !== 'auto' ? layout : ''})},
})

const loop = defineArrayMember({
  type: 'file',
  name: 'loop',
  title: 'Short video loop',
  description: 'A muted MP4 loop under 20 MB. Longer films go on YouTube or Vimeo.',
  options: {accept: 'video/mp4,video/webm'},
  fields: [defineField({name: 'caption', type: 'string', title: 'Caption'})],
})

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'content', title: 'Text', default: true},
    {name: 'media', title: 'Photos & video'},
    {name: 'details', title: 'Details'},
    {name: 'links', title: 'Links & SEO'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title', group: ['content', 'details'], validation: (r) => r.required()}),
    defineField({name: 'subtitle', type: 'string', title: 'Subtitle', description: 'One line under the title.', group: 'content'}),
    defineField({
      name: 'story',
      type: 'array',
      title: 'Story',
      description: 'The project text.',
      group: 'content',
      of: [defineArrayMember({type: 'block', styles: [{title: 'Normal', value: 'normal'}, {title: 'Heading', value: 'h3'}, {title: 'Quote', value: 'blockquote'}], lists: [{title: 'Bullets', value: 'bullet'}]})],
    }),
    defineField({name: 'system', type: 'text', rows: 3, title: 'System / tools', description: 'For experiential projects. One item per line.', group: 'content', hidden: ({document}) => !document?.disciplines?.includes('experiential')}),
    defineField({name: 'outcome', type: 'text', rows: 2, title: 'Outcome', group: 'content', hidden: ({document}) => !document?.disciplines?.includes('experiential')}),

    defineField({name: 'cover', type: 'image', title: 'Cover image', description: 'Shown in the Work index and on the homepage. If empty, the first photo is used.', options: {hotspot: true}, group: 'media'}),
    defineField({name: 'media', type: 'array', title: 'Photos & drawings', description: 'Drag photos in from your computer. Drag to reorder.', group: 'media', of: [media, loop], options: {layout: 'grid'}}),
    defineField({name: 'videoUrl', type: 'url', title: 'Film (YouTube or Vimeo link)', group: 'media', validation: (r) => r.uri({scheme: ['https']})}),
    defineField({name: 'heroVideo', type: 'file', title: 'Hero video loop', description: 'Optional muted MP4 shown at the top of the page instead of the cover photo. Under 20 MB.', options: {accept: 'video/mp4,video/webm'}, group: 'media'}),

    defineField({
      name: 'disciplines',
      type: 'array',
      title: 'Discipline',
      description: 'Pick one or more. Experiential and Film projects use the dark page style.',
      group: 'details',
      of: [{type: 'string'}],
      options: {list: DISCIPLINES, layout: 'grid'},
      validation: (r) => r.required().min(1),
    }),
    defineField({name: 'categories', type: 'array', title: 'Categories', description: 'Sub-categories shown as filters under each discipline on the Work page, e.g. Residences, Projection mapping, Music videos. Pick from the list or type your own.', group: 'details', of: [{type: 'string'}], options: {list: CATEGORIES, layout: 'tags'}}),
    defineField({name: 'client', type: 'string', title: 'Client / architect', group: 'details'}),
    defineField({name: 'location', type: 'string', title: 'Location', group: 'details'}),
    defineField({name: 'year', type: 'string', title: 'Year', description: 'Year completed or photographed, e.g. 2023.', group: 'details'}),
    defineField({name: 'period', type: 'string', title: 'Built / dates', description: 'e.g. 2021–22', group: 'details'}),
    defineField({name: 'area', type: 'string', title: 'Area', group: 'details'}),
    defineField({name: 'scope', type: 'string', title: 'Scope of work', group: 'details'}),
    defineField({name: 'role', type: 'string', title: 'Our role', group: 'details'}),
    defineField({
      name: 'credits',
      type: 'array',
      title: 'Credits',
      group: 'details',
      of: [defineArrayMember({type: 'object', name: 'credit', fields: [defineField({name: 'role', type: 'string', title: 'Role'}), defineField({name: 'name', type: 'string', title: 'Name'})], preview: {select: {title: 'name', subtitle: 'role'}}})],
    }),
    defineField({name: 'featured', type: 'boolean', title: 'Show on homepage', description: 'Adds this project to Selected work.', initialValue: false, group: 'details'}),
    defineField({name: 'featuredOrder', type: 'number', title: 'Homepage position', description: 'Orders this project among others of the same discipline on the homepage. The homepage then mixes the disciplines: 3 photography, 1 experiential, 1 architecture, 1 film, repeating.', group: 'details', hidden: ({document}) => !document?.featured}),
    defineField({name: 'sortDate', type: 'date', title: 'Sort date', description: 'Controls the order inside each discipline on the Work page (newest first). Filled automatically from the year if empty.', group: 'details'}),

    defineField({name: 'slug', type: 'slug', title: 'Page address', description: 'marufraihan.works/work/…', group: 'links', options: {source: 'title', maxLength: 96}, validation: (r) => r.required()}),
    defineField({name: 'oldUrls', type: 'array', title: 'Old Wix addresses', description: 'Anyone opening these old links is sent to this page. Paste the part after marufraihan.works, e.g. /architectural-project/hawladar-bari', group: 'links', of: [{type: 'string'}]}),
    defineField({
      name: 'links',
      type: 'array',
      title: 'Press & links',
      description: 'ArchDaily, articles, client pages.',
      group: 'links',
      of: [defineArrayMember({type: 'object', name: 'link', fields: [defineField({name: 'label', type: 'string', title: 'Label'}), defineField({name: 'url', type: 'url', title: 'Link'})], preview: {select: {title: 'label', subtitle: 'url'}}})],
    }),
    defineField({name: 'seoDescription', type: 'text', rows: 2, title: 'Search description', description: 'Shown by Google under the page title. About 150 characters.', group: 'links', validation: (r) => r.max(200)}),
    defineField({name: 'wixId', type: 'string', title: 'Wix ID', readOnly: true, hidden: true}),
  ],
  orderings: [
    {title: 'Newest first', name: 'dateDesc', by: [{field: 'sortDate', direction: 'desc'}]},
    {title: 'Title A–Z', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
    {title: 'Last edited', name: 'updatedDesc', by: [{field: '_updatedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', d: 'disciplines', y: 'year', media: 'cover', first: 'media.0.asset', featured: 'featured'},
    prepare: ({title, d, y, media, first, featured}) => ({
      title,
      subtitle: [(d || []).map((x) => x[0].toUpperCase() + x.slice(1)).join(', '), y, featured ? 'On homepage' : ''].filter(Boolean).join(' · '),
      media: media || first,
    }),
  },
})
