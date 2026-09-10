import 'server-only'

import type {SEARCH_HYDRATION_QUERY_RESULT} from '@/sanity.types'
import type {SearchCandidate, SearchImage, SearchResult} from '@/lib/search/schema'

import {sanityCacheTags} from '../lib/cache-tags'
import {sanityFetch} from '../lib/fetch'
import {SEARCH_HYDRATION_QUERY} from '../queries/search'

function cleanText(value: string | null | undefined, maximum = 190) {
  const text = value?.replace(/\s+/g, ' ').trim() ?? ''
  if (text.length <= maximum) return text
  return `${text.slice(0, maximum - 1).trimEnd()}…`
}

function imageOrNull(image: {
  url: string | null
  lqip: string | null
  width: number | null
  height: number | null
  alt: string | null
} | null): SearchImage | null {
  if (!image?.url) return null
  return {...image, url: image.url}
}

function searchTerms(query: string) {
  const stopWords = new Set([
    'about',
    'and',
    'are',
    'can',
    'course',
    'for',
    'from',
    'how',
    'lesson',
    'learn',
    'the',
    'this',
    'what',
    'with',
  ])
  return Array.from(
    new Set(
      query
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}+#.]+/u)
        .map((term) => term.trim())
        .filter((term) => term.length > 1 && !stopWords.has(term)),
    ),
  )
}

function matchesSearchQuery(query: string, searchableText: string) {
  const normalizedText = searchableText.toLocaleLowerCase()
  const terms = searchTerms(query)
  if (terms.length > 0) return terms.some((term) => normalizedText.includes(term))
  return normalizedText.includes(query.toLocaleLowerCase().trim())
}

function relevanceBoost(query: string, title: string, searchableText: string) {
  const normalizedQuery = query.toLocaleLowerCase().trim()
  const normalizedTitle = title.toLocaleLowerCase()
  const normalizedText = searchableText.toLocaleLowerCase()
  const terms = searchTerms(query)
  let boost = 0

  if (normalizedTitle === normalizedQuery) boost += 0.5
  else if (normalizedTitle.includes(normalizedQuery)) boost += 0.35

  if (terms.length > 0 && terms.every((term) => normalizedTitle.includes(term))) boost += 0.25
  else if (terms.some((term) => normalizedTitle.includes(term))) boost += 0.12

  if (terms.length > 0 && terms.every((term) => normalizedText.includes(term))) boost += 0.12
  else if (terms.some((term) => normalizedText.includes(term))) boost += 0.05

  return boost
}

function dedupeCandidates(candidates: SearchCandidate[]) {
  const byKey = new Map<string, SearchCandidate>()
  for (const candidate of candidates) {
    const key =
      candidate.kind === 'lesson'
        ? `lesson:${candidate.lessonId}`
        : `video:${candidate.lessonId}:${candidate.videoDocumentId}:${candidate.startSeconds}`
    const current = byKey.get(key)
    if (!current || candidate.score > current.score) byKey.set(key, candidate)
  }
  return [...byKey.values()]
}

export async function hydrateSearchCandidates(query: string, input: SearchCandidate[]) {
  const candidates = dedupeCandidates(input)
  if (candidates.length === 0) return []

  const lessonIds = Array.from(new Set(candidates.map((candidate) => candidate.lessonId)))
  const videoCandidates = candidates.filter(
    (candidate): candidate is Extract<SearchCandidate, {kind: 'video'}> => candidate.kind === 'video',
  )
  const videoDocumentIds = Array.from(
    new Set(videoCandidates.map((candidate) => candidate.videoDocumentId)),
  )
  const startSeconds = Array.from(
    new Set(videoCandidates.map((candidate) => candidate.startSeconds)),
  )

  const payload = await sanityFetch<SEARCH_HYDRATION_QUERY_RESULT>({
    query: SEARCH_HYDRATION_QUERY,
    params: {lessonIds, videoDocumentIds, startSeconds},
    tags: [sanityCacheTags.courses, sanityCacheTags.lessons, sanityCacheTags.videos],
    revalidate: 60,
  })

  const lessonById = new Map(payload.lessons.map((lesson) => [lesson._id, lesson]))
  const videoById = new Map(payload.videos.map((video) => [video._id, video]))
  const results: SearchResult[] = []

  for (const candidate of candidates) {
    const lesson = lessonById.get(candidate.lessonId)
    if (!lesson?.slug || !lesson.title) continue

    let parentCourse: (typeof payload.courses)[number] | undefined
    let moduleIndex = -1
    let lessonIndex = -1

    for (const course of payload.courses) {
      const foundModuleIndex = (course.modules ?? []).findIndex((courseModule) =>
        (courseModule.lessons ?? []).some((item) => item._id === lesson._id),
      )
      if (foundModuleIndex < 0) continue
      parentCourse = course
      moduleIndex = foundModuleIndex
      lessonIndex = (course.modules?.[foundModuleIndex]?.lessons ?? []).findIndex(
        (item) => item._id === lesson._id,
      )
      break
    }

    const courseModule = parentCourse?.modules?.[moduleIndex]
    if (!parentCourse?.slug || !parentCourse.title || !courseModule?.title || lessonIndex < 0) continue

    const base = {
      score: candidate.score,
      course: {
        id: parentCourse._id,
        title: parentCourse.title,
        slug: parentCourse.slug,
        image: imageOrNull(parentCourse.image),
      },
      module: {title: courseModule.title, number: moduleIndex + 1},
      lesson: {
        id: lesson._id,
        title: lesson.title,
        slug: lesson.slug,
        number: lessonIndex + 1,
        duration: Math.max(0, Math.round(lesson.duration ?? 0)),
        thumbnail: imageOrNull(lesson.thumbnail),
      },
    }

    if (candidate.kind === 'lesson') {
      const keyPoints = (lesson.keyPoints ?? []).filter((point): point is string => Boolean(point))
      const searchableText = [
        parentCourse.title,
        courseModule.title,
        lesson.title,
        keyPoints.join(' '),
        lesson.notesText,
      ].join(' ')
      if (!matchesSearchQuery(query, searchableText)) continue
      const description = cleanText(lesson.notesText) || cleanText(keyPoints.join(' · '))
      results.push({
        ...base,
        id: `lesson:${lesson._id}`,
        kind: 'lesson',
        score:
          base.score +
          relevanceBoost(query, lesson.title, `${keyPoints.join(' ')} ${lesson.notesText ?? ''}`),
        description,
        keyPoints,
      })
      continue
    }

    const video = videoById.get(candidate.videoDocumentId)
    if (!video || !video.url || video.url !== lesson.videoUrl) continue

    const storedMoment =
      candidate.source === 'chapter'
        ? video.chapters?.find((chapter) => chapter.startSeconds === candidate.startSeconds)
        : video.chunks?.find((chunk) => chunk.startSeconds === candidate.startSeconds)
    const matchedText =
      storedMoment && 'label' in storedMoment ? storedMoment.label : storedMoment?.text
    if (!matchedText) continue

    if (
      !matchesSearchQuery(
        query,
        `${parentCourse.title} ${courseModule.title} ${lesson.title} ${matchedText}`,
      )
    ) continue

    const description = cleanText(matchedText)
    results.push({
      ...base,
      id: `video:${lesson._id}:${candidate.startSeconds}`,
      kind: 'video',
      score:
        base.score +
        (candidate.source === 'chapter' ? 0.2 : 0.08) +
        relevanceBoost(query, lesson.title, matchedText),
      description,
      startSeconds: candidate.startSeconds,
      matchedText: description,
      source: candidate.source,
    })
  }

  return results.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
}
