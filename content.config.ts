// import { defineCollection, z } from '@nuxt/content'

import { defineCollection } from '@nuxt/content'

// Since we've removed all content collections (docs, blog, pricing, changelog),
// this file can be simplified or even empty for now.
// You can add new collections as needed for your showcase, explorer, ranking, sources pages.

export const collections = {
  // Add collections here as needed for your new pages
  // Example structure for future use:
  showcase: defineCollection({
    source: 'showcase/**/*',
    type: 'page'
  })
}
