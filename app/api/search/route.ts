import {randomUUID} from 'node:crypto'

import {NextResponse} from 'next/server'

import {findSearchCandidates} from '@/lib/search/search-agent'
import {searchRequestSchema, type SearchStreamEvent} from '@/lib/search/schema'
import {findDirectSearchCandidates, hydrateSearchCandidates} from '@/sanity/data/search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function line(event: SearchStreamEvent) {
  return `${JSON.stringify(event)}\n`
}

function describeSearchError(error: unknown) {
  if (!(error instanceof Error)) return {type: typeof error}

  const cause = error.cause
  const causeDetails =
    cause && typeof cause === 'object'
      ? {
          code: 'code' in cause ? String(cause.code) : undefined,
          status: 'status' in cause ? String(cause.status) : undefined,
          message:
            'message' in cause && typeof cause.message === 'string'
              ? cause.message
              : undefined,
        }
      : undefined

  return {
    name: error.name,
    message: error.message,
    cause: causeDetails,
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Request body must be valid JSON.'}, {status: 400})
  }

  const parsed = searchRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {error: 'Search queries must contain between 2 and 200 characters.'},
      {status: 400},
    )
  }

  const requestId = randomUUID()
  const encoder = new TextEncoder()
  const startedAt = performance.now()
  const abortController = new AbortController()
  let streamClosed = false
  const abort = () => abortController.abort()
  request.signal.addEventListener('abort', abort, {once: true})

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SearchStreamEvent) => {
        if (!streamClosed && !abortController.signal.aborted) {
          controller.enqueue(encoder.encode(line(event)))
        }
      }

      try {
        send({type: 'status', requestId, message: 'Searching your courses and lessons…'})
        const directCandidates = await findDirectSearchCandidates(parsed.data.query)
        if (abortController.signal.aborted) return

        let results = await hydrateSearchCandidates(parsed.data.query, directCandidates)
        if (abortController.signal.aborted) return

        if (results.length === 0) {
          send({type: 'status', requestId, message: 'Looking for related concepts…'})
          const semanticSignal = AbortSignal.any([
            abortController.signal,
            AbortSignal.timeout(4_500),
          ])

          try {
            const semanticCandidates = await findSearchCandidates(
              parsed.data.query,
              semanticSignal,
            )
            if (abortController.signal.aborted) return
            results = await hydrateSearchCandidates(parsed.data.query, semanticCandidates)
          } catch (semanticError) {
            if (!abortController.signal.aborted) {
              console.warn(
                `[search:${requestId}] semantic expansion unavailable`,
                describeSearchError(semanticError),
              )
            }
          }
        }

        const videoCount = results.filter((result) => result.kind === 'video').length
        const lessonCount = results.length - videoCount
        const courseCount = new Set(results.map((result) => result.course.id)).size

        send({
          type: 'meta',
          requestId,
          total: results.length,
          courseCount,
          videoCount,
          lessonCount,
        })

        for (const result of results) {
          send({type: 'result', requestId, result})
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error(`[search:${requestId}] request failed`, describeSearchError(error))
          send({
            type: 'error',
            requestId,
            code: 'search_unavailable',
            message: 'Search is temporarily unavailable. Please try again.',
          })
        }
      } finally {
        request.signal.removeEventListener('abort', abort)
        if (!abortController.signal.aborted) {
          send({type: 'done', requestId, durationMs: Math.round(performance.now() - startedAt)})
        }
        if (!streamClosed) {
          streamClosed = true
          controller.close()
        }
      }
    },
    cancel() {
      streamClosed = true
      abortController.abort()
      request.signal.removeEventListener('abort', abort)
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-Id': requestId,
    },
  })
}
