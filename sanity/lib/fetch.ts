import 'server-only'

import type {QueryParams} from 'next-sanity'

import {client} from './client'

type SanityFetchOptions = {
  query: string
  params?: QueryParams
  tags?: string[]
  revalidate?: number | false
}

// A content read must not hang a page render forever. Abort the request after
// this timeout so a slow or unreachable dataset surfaces as an error the
// route-level error boundary can catch, instead of an indefinite pending state.
const TIMEOUT_MS = 10_000

export async function sanityFetch<Result>({
  query,
  params = {},
  tags = [],
  revalidate = 300,
}: SanityFetchOptions): Promise<Result> {
  try {
    return await client.fetch<Result>(query, params, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: {revalidate, tags},
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error(`Sanity request timed out after ${TIMEOUT_MS}ms`, {cause: error})
    }
    throw error
  }
}
