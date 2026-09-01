import 'server-only'

import type {QueryParams} from 'next-sanity'

import {client} from './client'

type SanityFetchOptions = {
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
}: SanityFetchOptions): Promise<Result> {
  return client.fetch<Result>(query, params, {
    next: {revalidate, tags},
  })
}
