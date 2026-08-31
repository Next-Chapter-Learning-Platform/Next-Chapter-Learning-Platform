import 'server-only'

import type {
  INSTRUCTOR_BY_SLUG_QUERY_RESULT,
  INSTRUCTOR_SLUGS_QUERY_RESULT,
} from '@/sanity.types'

import {sanityCacheTags} from '../lib/cache-tags'
import {sanityFetch} from '../lib/fetch'
import {
  INSTRUCTOR_BY_SLUG_QUERY,
  INSTRUCTOR_SLUGS_QUERY,
} from '../queries/instructors'

export function getInstructorBySlug(slug: string) {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return Promise.resolve(null)

  return sanityFetch<INSTRUCTOR_BY_SLUG_QUERY_RESULT>({
    query: INSTRUCTOR_BY_SLUG_QUERY,
    params: {slug: normalizedSlug},
    tags: [
      sanityCacheTags.instructors,
      sanityCacheTags.instructor(normalizedSlug),
      sanityCacheTags.courses,
      sanityCacheTags.categories,
    ],
  })
}

export function getInstructorSlugs() {
  return sanityFetch<INSTRUCTOR_SLUGS_QUERY_RESULT>({
    query: INSTRUCTOR_SLUGS_QUERY,
    tags: [sanityCacheTags.instructors],
  })
}
