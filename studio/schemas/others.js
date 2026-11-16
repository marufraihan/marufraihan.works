import {defineType, defineField, defineArrayMember} from 'sanity'

const text = (name, title, extra = {}) => defineField({name, title, type: 'text', rows: 3, ...extra})
const pt = (name, title) => defineField({name, title, type: 'array', of: [defineArrayMember({type: 'block', styles: [{title: 'Normal', value: 'normal'}, {title: 'Heading', value: 'h3'}]})]})

export const journal = defineType({
  name: 'post',
  title: 'Journal post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', title: 'Page address', options: {source: 'title'}, validation: (r) => r.required()}),
    defineField({name: 'date', type: 'date', title: 'Date', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required()}),
    defineField({name: 'kind', type: 'string', title: 'Type', options: {list: ['News', 'Exhibition', 'Photography', 'Architecture', 'Experiential', 'Press']}}),
    defineField({name: 'cover', type: 'image', title: 'Cover image', options: {hotspot: true}}),
    defineField({name: 'body', type: 'array', title: 'Text', of: [defineArrayMember({type: 'block'}), defineArrayMember({type: 'image', options: {hotspot: true}, fields: [defineField({name: 'caption', type: 'string', title: 'Caption'})]})]}),
    defineField({name: 'project', type: 'reference', title: 'Related project', to: [{type: 'project'}]}),
  ],
  orderings: [{title: 'Newest', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'date', media: 'cover'}},
})

export const member = defineType({
  name: 'member',
  title: 'Team member',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Name', validation: (r) => r.required()}),
    defineField({name: 'role', type: 'string', title: 'Role'}),
    defineField({name: 'photo', type: 'image', title: 'Photo', options: {hotspot: true}}),
    defineField({name: 'order', type: 'number', title: 'Position', description: '1 shows first.'}),
  ],
  orderings: [{title: 'Position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'role', media: 'photo'}},
})

export const home = defineType({
  name: 'home',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({name: 'headline', type: 'string', title: 'Headline', initialValue: 'Architecture, image and light.'}),
    defineField({name: 'reel', type: 'file', title: 'Showreel (desktop, 16:9)', description: 'Muted MP4, 1920×1080, under 20 MB.', options: {accept: 'video/mp4'}}),
    defineField({name: 'reelMobile', type: 'file', title: 'Showreel (phone, vertical)', description: 'Muted MP4, 1080×1920 or 1080×1350, under 15 MB.', options: {accept: 'video/mp4'}}),
    defineField({name: 'poster', type: 'image', title: 'Still image', description: 'Shown while the reel loads, or instead of it.', options: {hotspot: true}}),
    text('intro', 'Studio statement'),
    defineField({name: 'servicesTitle', type: 'string', title: 'Experiential section title', initialValue: 'Projection, LED and immersive rooms.'}),
    text('servicesText', 'Experiential section text'),
    defineField({
      name: 'services',
      type: 'array',
      title: 'Services list',
      of: [defineArrayMember({type: 'object', name: 'service', fields: [defineField({name: 'name', type: 'string', title: 'Service'}), defineField({name: 'note', type: 'string', title: 'Short note'})], preview: {select: {title: 'name', subtitle: 'note'}}})],
    }),
    defineField({name: 'servicesVideo', type: 'file', title: 'Experiential section video loop', options: {accept: 'video/mp4'}}),
    defineField({name: 'servicesImage', type: 'image', title: 'Experiential section still', options: {hotspot: true}}),
  ],
  preview: {prepare: () => ({title: 'Homepage'})},
})

export const studioPage = defineType({
  name: 'studioPage',
  title: 'Studio page',
  type: 'document',
  fields: [
    defineField({name: 'headline', type: 'string', title: 'Headline', initialValue: 'Space, image and emotion.'}),
    defineField({name: 'portrait', type: 'image', title: 'Portrait', options: {hotspot: true}}),
    pt('bio', 'Bio'),
    defineField({
      name: 'timeline',
      type: 'array',
      title: 'Practice',
      of: [defineArrayMember({type: 'object', name: 'entry', fields: [defineField({name: 'years', type: 'string', title: 'Years'}), defineField({name: 'text', type: 'string', title: 'Role and company'})], preview: {select: {title: 'text', subtitle: 'years'}}})],
    }),
    defineField({
      name: 'education',
      type: 'array',
      title: 'Education',
      of: [defineArrayMember({type: 'object', name: 'entry', fields: [defineField({name: 'years', type: 'string', title: 'Years'}), defineField({name: 'text', type: 'string', title: 'Degree and school'})], preview: {select: {title: 'text', subtitle: 'years'}}})],
    }),
    defineField({
      name: 'pressLinks',
      type: 'array',
      title: 'Featured in (articles)',
      description: 'Articles about the studio or its projects. Shown with links on the Studio page.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'article',
          fields: [
            defineField({name: 'publication', type: 'string', title: 'Publication', validation: (r) => r.required()}),
            defineField({name: 'title', type: 'string', title: 'Article title'}),
            defineField({name: 'year', type: 'string', title: 'Year'}),
            defineField({name: 'url', type: 'url', title: 'Link'}),
            defineField({name: 'project', type: 'reference', title: 'Project', to: [{type: 'project'}]}),
          ],
          preview: {select: {title: 'title', subtitle: 'publication'}, prepare: ({title, subtitle}) => ({title: title || subtitle, subtitle: title ? subtitle : ''})},
        }),
      ],
    }),
    defineField({name: 'press', type: 'array', title: 'Featured in (names only)', description: 'Publications to list without a link.', of: [{type: 'string'}]}),
  ],
  preview: {prepare: () => ({title: 'Studio page'})},
})

export const settings = defineType({
  name: 'settings',
  title: 'Contact & settings',
  type: 'document',
  fields: [
    defineField({name: 'email', type: 'string', title: 'Email', initialValue: 'mail@marufraihan.works'}),
    defineField({name: 'phone', type: 'string', title: 'Phone', initialValue: '+880 1671 034081'}),
    defineField({name: 'address', type: 'text', rows: 2, title: 'Address', initialValue: 'Flat B4, House 06, Road 07\nBlock C, Niketon, Dhaka 1212'}),
    defineField({name: 'instagram', type: 'url', title: 'Instagram', initialValue: 'https://www.instagram.com/marufraihan.works'}),
    defineField({name: 'facebook', type: 'url', title: 'Facebook'}),
    defineField({name: 'youtube', type: 'url', title: 'YouTube'}),
    defineField({name: 'sister', type: 'string', title: 'Sister studios line', initialValue: 'Surreal BD, Corpovisuals, Shoho Studio'}),
    defineField({name: 'seoDescription', type: 'text', rows: 2, title: 'Site description for Google'}),
  ],
  preview: {prepare: () => ({title: 'Contact & settings'})},
})

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  description: 'Send an old address to a new page. Project pages handle their own old addresses.',
  fields: [
    defineField({name: 'from', type: 'string', title: 'Old address', description: 'e.g. /about', validation: (r) => r.required().custom((v) => (!v || v.startsWith('/') ? true : 'Start with /'))}),
    defineField({name: 'to', type: 'string', title: 'New address', description: 'e.g. /studio', validation: (r) => r.required()}),
  ],
  preview: {select: {title: 'from', subtitle: 'to'}},
})
