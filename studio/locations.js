import {defineLocations} from 'sanity/presentation'

export const locations = {
  project: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({locations: doc?.slug ? [{title: (doc.title || 'Project') + ' (live preview)', href: `/preview/?slug=${doc.slug}`}, {title: 'Published page', href: `/work/${doc.slug}/`}] : []}),
  }),
  post: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'Post', href: `/journal/${doc.slug}/`}] : []}),
  }),
  home: defineLocations({message: 'This is the homepage', locations: [{title: 'Home', href: '/'}]}),
  studioPage: defineLocations({locations: [{title: 'Studio', href: '/studio/'}]}),
  member: defineLocations({locations: [{title: 'Studio', href: '/studio/'}]}),
}
