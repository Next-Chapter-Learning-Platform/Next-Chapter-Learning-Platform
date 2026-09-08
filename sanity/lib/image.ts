import 'server-only'

import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

import {dataset, projectId} from './env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({projectId, dataset})

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}

// The dataset is private, so an anonymous request to cdn.sanity.io is refused.
// Route the built asset URL through our server so it is fetched with the read
// token. The token stays server side; the browser only sees the local path.
export const proxyImageUrl = (url: string) =>
  `/api/sanity-image?url=${encodeURIComponent(url)}`
