const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

export function getYouTubeVideoId(videoUrl: string) {
  try {
    const url = new URL(videoUrl)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    let id: string | null = null

    if (hostname === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] ?? null
    } else if (
      hostname === 'youtube.com' ||
      hostname === 'youtube-nocookie.com' ||
      hostname === 'm.youtube.com'
    ) {
      if (url.pathname === '/watch') id = url.searchParams.get('v')
      else if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
        id = url.pathname.split('/')[2] ?? null
      }
    }

    return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null
  } catch {
    return null
  }
}

export function buildYouTubeEmbedUrl({
  videoId,
  origin,
  startSeconds = 0,
}: {
  videoId: string
  origin: string
  startSeconds?: number
}) {
  if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) return null

  try {
    const originUrl = new URL(origin)
    if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') return null

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`)
    embedUrl.searchParams.set('rel', '0')
    embedUrl.searchParams.set('playsinline', '1')
    embedUrl.searchParams.set('origin', originUrl.origin)

    const safeStart = Math.max(0, Math.min(Math.round(startSeconds), 86_400))
    if (safeStart > 0) embedUrl.searchParams.set('start', String(safeStart))

    return embedUrl.toString()
  } catch {
    return null
  }
}
