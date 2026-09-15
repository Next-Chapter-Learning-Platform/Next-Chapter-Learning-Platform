'use client'

import Image from 'next/image'
import {useSyncExternalStore} from 'react'

import {buildYouTubeEmbedUrl} from '@/lib/video/youtube'

import styles from './page.module.css'

const subscribeToHydration = () => () => undefined

export function YouTubePlayer({
  videoId,
  title,
  startSeconds,
  posterUrl,
  posterAlt,
  posterBlurDataUrl,
}: {
  videoId: string
  title: string
  startSeconds: number
  posterUrl: string | null
  posterAlt: string
  posterBlurDataUrl?: string
}) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const source = hydrated
    ? buildYouTubeEmbedUrl({videoId, startSeconds, origin: window.location.origin})
    : undefined

  if (!source) {
    return (
      <div className={styles.videoUnavailable}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={posterAlt}
            fill
            sizes="(max-width: 900px) calc(100vw - 40px), 900px"
            placeholder={posterBlurDataUrl ? 'blur' : 'empty'}
            blurDataURL={posterBlurDataUrl}
          />
        ) : null}
        <p>{source === null ? 'This lesson video is currently unavailable.' : 'Loading lesson video…'}</p>
      </div>
    )
  }

  return (
    <iframe
      src={source}
      title={`${title} video`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  )
}
