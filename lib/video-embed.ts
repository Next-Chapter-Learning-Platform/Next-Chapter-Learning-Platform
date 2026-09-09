export type VideoProvider = 'youtube' | 'vimeo' | 'bunny'

export type VideoEmbed = {
  src: string
  title: string
  provider: VideoProvider
}

// Turn a stored lesson video URL into an on-site provider embed. Playback stays
// on the lesson page, so a lesson never links a learner out to the provider.
// When a start second is given (used by search video moments), the embed opens
// at that second with the provider's own start parameter.
export function buildVideoEmbed(
  videoUrl: string | null | undefined,
  startSeconds = 0,
): VideoEmbed | null {
  if (!videoUrl) return null

  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '')
  const start =
    Number.isFinite(startSeconds) && startSeconds > 0 ? Math.floor(startSeconds) : 0

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtu.be' ||
    host === 'youtube-nocookie.com'
  ) {
    let id = ''
    if (host === 'youtu.be') id = url.pathname.slice(1)
    else if (url.pathname.startsWith('/embed/')) id = url.pathname.split('/')[2] ?? ''
    else id = url.searchParams.get('v') ?? ''
    if (!id) return null

    const params = new URLSearchParams({rel: '0', modestbranding: '1'})
    if (start) params.set('start', String(start))
    return {
      src: `https://www.youtube.com/embed/${id}?${params.toString()}`,
      title: 'YouTube video player',
      provider: 'youtube',
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop() ?? ''
    if (!/^\d+$/.test(id)) return null
    return {
      src: `https://player.vimeo.com/video/${id}${start ? `#t=${start}s` : ''}`,
      title: 'Vimeo video player',
      provider: 'vimeo',
    }
  }

  if (host === 'iframe.mediadelivery.net') {
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length >= 3) {
      const [, library, videoId] = parts
      const params = new URLSearchParams()
      if (start) params.set('t', String(start))
      const query = params.toString()
      return {
        src: `https://iframe.mediadelivery.net/embed/${library}/${videoId}${query ? `?${query}` : ''}`,
        title: 'Bunny video player',
        provider: 'bunny',
      }
    }
  }

  return null
}
