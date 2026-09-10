import {z} from 'zod'

export const searchRequestSchema = z.object({
  query: z.string().trim().min(2).max(200),
})

const scoreSchema = z.number().finite().min(0).max(1)

const searchAgentCandidateSchema = z.object({
  kind: z.enum(['lesson', 'video']),
  lessonId: z.string().min(1),
  videoDocumentId: z.string(),
  startSeconds: z.number().int().nonnegative().max(86_400),
  source: z.enum(['none', 'chapter', 'transcript']),
  score: scoreSchema,
})

export const searchAgentOutputSchema = z.object({
  results: z.array(searchAgentCandidateSchema).max(300),
})

export type SearchCandidate =
  | {
      kind: 'lesson'
      lessonId: string
      score: number
    }
  | {
      kind: 'video'
      lessonId: string
      videoDocumentId: string
      startSeconds: number
      source: 'chapter' | 'transcript'
      score: number
    }

export type SearchImage = {
  url: string
  lqip: string | null
  width: number | null
  height: number | null
  alt: string | null
}

type SearchResultBase = {
  id: string
  score: number
  course: {
    id: string
    title: string
    slug: string
    image: SearchImage | null
  }
  module: {
    title: string
    number: number
  }
  lesson: {
    id: string
    title: string
    slug: string
    number: number
    duration: number
    thumbnail: SearchImage | null
  }
  description: string
}

export type LessonSearchResult = SearchResultBase & {
  kind: 'lesson'
  keyPoints: string[]
}

export type VideoSearchResult = SearchResultBase & {
  kind: 'video'
  startSeconds: number
  matchedText: string
  source: 'chapter' | 'transcript'
}

export type SearchResult = LessonSearchResult | VideoSearchResult

export type SearchStreamEvent =
  | {type: 'status'; requestId: string; message: string}
  | {
      type: 'meta'
      requestId: string
      total: number
      courseCount: number
      videoCount: number
      lessonCount: number
    }
  | {type: 'result'; requestId: string; result: SearchResult}
  | {
      type: 'error'
      requestId: string
      code: 'configuration' | 'search_unavailable'
      message: string
    }
  | {type: 'done'; requestId: string; durationMs: number}
