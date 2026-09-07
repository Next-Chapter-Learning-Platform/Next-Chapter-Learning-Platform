import 'server-only'

import type {
  COURSE_BY_SLUG_QUERY_RESULT,
  COURSE_SLUGS_QUERY_RESULT,
  COURSES_QUERY_RESULT,
  HOMEPAGE_COURSES_QUERY_RESULT,
} from '@/sanity.types'

import {sanityCacheTags} from '../lib/cache-tags'
import {sanityFetch} from '../lib/fetch'
import {
  COURSE_BY_SLUG_QUERY,
  COURSE_SLUGS_QUERY,
  COURSES_QUERY,
  HOMEPAGE_COURSES_QUERY,
} from '../queries/courses'

export function getHomepageCourses() {
  return sanityFetch<HOMEPAGE_COURSES_QUERY_RESULT>({
    query: HOMEPAGE_COURSES_QUERY,
    tags: [sanityCacheTags.courses, sanityCacheTags.lessons],
  })
}

export function getCourses() {
  return sanityFetch<COURSES_QUERY_RESULT>({
    query: COURSES_QUERY,
    tags: [
      sanityCacheTags.courses,
      sanityCacheTags.categories,
      sanityCacheTags.instructors,
      sanityCacheTags.lessons,
    ],
  })
}

export function getCourseBySlug(slug: string) {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return Promise.resolve(null)

  return sanityFetch<COURSE_BY_SLUG_QUERY_RESULT>({
    query: COURSE_BY_SLUG_QUERY,
    params: {slug: normalizedSlug},
    tags: [
      sanityCacheTags.courses,
      sanityCacheTags.course(normalizedSlug),
      sanityCacheTags.categories,
      sanityCacheTags.instructors,
      sanityCacheTags.lessons,
    ],
  })
}

export function getCourseSlugs() {
  return sanityFetch<COURSE_SLUGS_QUERY_RESULT>({
    query: COURSE_SLUGS_QUERY,
    tags: [sanityCacheTags.courses],
  })
}
