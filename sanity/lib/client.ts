import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId, readToken} from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: readToken,
  perspective: 'published',
  useCdn: false,
})
