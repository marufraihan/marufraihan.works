'use client'
import {createQueryStore} from '@sanity/react-loader'

// Queries only run in the CMS's "Edit on page" view; normal visitors get the pre-built page.
export const {useQuery, useLiveMode} = createQueryStore({client: false, ssr: true})
