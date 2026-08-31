import 'server-only'

import type {QueryParams} from 'next-sanity'

import {client} from './client'

type SanityFetchOptions<Result> = {
  query: string
  params?: QueryParams
  tags?: string[]
  revalidate?: number | false
}

export async function sanityFetch<Result>({
  query,
  params = {},
  tags = [],
  revalidate = 300,
}: SanityFetchOptions<Result>): Promise<Result> {
  return client.fetch<Result>(query, params, {
    next: {revalidate, tags},
  })
}
