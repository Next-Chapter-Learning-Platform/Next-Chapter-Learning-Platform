import 'server-only'

import type {
  COURSE_FOR_LESSON_QUERY_RESULT,
  LESSON_BY_SLUG_QUERY_RESULT,
  LESSON_SLUGS_QUERY_RESULT,
} from '@/sanity.types'

import {sanityCacheTags} from '../lib/cache-tags'
import {sanityFetch} from '../lib/fetch'
import {
  COURSE_FOR_LESSON_QUERY,
  LESSON_BY_SLUG_QUERY,
  LESSON_SLUGS_QUERY,
} from '../queries/lessons'

export async function getLessonBySlug(slug: string) {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const lesson = await sanityFetch<LESSON_BY_SLUG_QUERY_RESULT>({
    query: LESSON_BY_SLUG_QUERY,
    params: {slug: normalizedSlug},
    tags: [sanityCacheTags.lessons, sanityCacheTags.lesson(normalizedSlug)],
  })

  if (!lesson) return null

  const parentCourse = await sanityFetch<COURSE_FOR_LESSON_QUERY_RESULT>({
    query: COURSE_FOR_LESSON_QUERY,
    params: {lessonId: lesson._id},
    tags: [
      sanityCacheTags.courses,
      sanityCacheTags.lessons,
      sanityCacheTags.lesson(normalizedSlug),
      sanityCacheTags.categories,
      sanityCacheTags.instructors,
    ],
  })

  if (!parentCourse) return {...lesson, course: null}

  const modules = parentCourse.modules ?? []
  const moduleIndex = modules.findIndex((courseModule) =>
    (courseModule.lessons ?? []).some(
      (moduleLesson) => moduleLesson._id === lesson._id,
    ),
  )

  if (moduleIndex < 0) return {...lesson, course: null}

  const currentModule = modules[moduleIndex]
  const lessonIndex = (currentModule.lessons ?? []).findIndex(
    (moduleLesson) => moduleLesson._id === lesson._id,
  )
  const moduleNumber = moduleIndex + 1
  const lessonNumber = lessonIndex + 1
  const orderedLessons = modules.flatMap((courseModule, orderedModuleIndex) =>
    (courseModule.lessons ?? []).map((moduleLesson, orderedLessonIndex) => ({
      ...moduleLesson,
      moduleNumber: orderedModuleIndex + 1,
      lessonNumber: orderedLessonIndex + 1,
      moduleTitle: courseModule.title,
    })),
  )
  const orderedLessonIndex = orderedLessons.findIndex(
    (moduleLesson) => moduleLesson._id === lesson._id,
  )
  const courseSummary = {
    _id: parentCourse._id,
    title: parentCourse.title,
    slug: parentCourse.slug,
    level: parentCourse.level,
    coverImage: parentCourse.coverImage,
    category: parentCourse.category,
    instructor: parentCourse.instructor,
  }

  return {
    ...lesson,
    course: {
      ...courseSummary,
      module: currentModule,
      moduleNumber,
      lessonNumber,
      lessonLabel: `Lesson ${moduleNumber}.${lessonNumber}`,
      modules,
      previousLesson:
        orderedLessonIndex > 0 ? orderedLessons[orderedLessonIndex - 1] : null,
      nextLesson:
        orderedLessonIndex >= 0 && orderedLessonIndex < orderedLessons.length - 1
          ? orderedLessons[orderedLessonIndex + 1]
          : null,
    },
  }
}

export function getLessonSlugs() {
  return sanityFetch<LESSON_SLUGS_QUERY_RESULT>({
    query: LESSON_SLUGS_QUERY,
    tags: [sanityCacheTags.lessons],
  })
}
