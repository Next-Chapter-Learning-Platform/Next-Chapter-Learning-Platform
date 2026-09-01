import 'server-only'

import type {CATEGORIES_QUERY_RESULT} from '@/sanity.types'

import {CATEGORIES_QUERY} from '../queries/categories'
import {sanityCacheTags} from '../lib/cache-tags'
import {sanityFetch} from '../lib/fetch'

export function getCategories() {
  return sanityFetch<CATEGORIES_QUERY_RESULT>({
    query: CATEGORIES_QUERY,
    tags: [sanityCacheTags.categories, sanityCacheTags.courses],
  })
}
