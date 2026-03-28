/** Shared parsing for public page + admin preview. No network calls. */

function tryParseHttpUrl(raw: string): URL | null {
  const t = raw.trim()
  if (!t) return null
  try {
    const u = new URL(t)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u
  } catch {
    return null
  }
}

const YT_ID = /^[\w-]{11}$/

function youtubeEmbedFromId(id: string): string | null {
  return YT_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

/** Returns a normalized embed URL for iframe src, or null if not a recognized YouTube link. */
export function getYoutubeEmbedSrc(raw: string): string | null {
  const u = tryParseHttpUrl(raw)
  if (!u) return null

  const host = u.hostname.toLowerCase().replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0] ?? ''
    return youtubeEmbedFromId(id)
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.slice('/embed/'.length).split('/')[0]?.split('?')[0] ?? ''
      return youtubeEmbedFromId(id)
    }
    if (u.pathname.startsWith('/watch')) {
      const v = u.searchParams.get('v') ?? ''
      return youtubeEmbedFromId(v)
    }
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.slice('/shorts/'.length).split('/')[0]?.split('?')[0] ?? ''
      return youtubeEmbedFromId(id)
    }
  }

  return null
}

const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov)(\?|#|$)/i

export function getDirectVideoSrc(raw: string): string | null {
  const u = tryParseHttpUrl(raw)
  if (!u) return null
  const key = `${u.pathname.toLowerCase()}${u.search.toLowerCase()}`
  if (VIDEO_EXT.test(key)) return raw.trim()
  return null
}

export type VideoPresentation =
  | { kind: 'youtube'; embedSrc: string }
  | { kind: 'direct'; src: string }

export function parseVideoUrl(raw: string): VideoPresentation | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const yt = getYoutubeEmbedSrc(trimmed)
  if (yt) return { kind: 'youtube', embedSrc: yt }
  const direct = getDirectVideoSrc(trimmed)
  if (direct) return { kind: 'direct', src: direct }
  return null
}

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|opus|flac)(\?|#|$)/i

/** Extensions accepted for uploads and direct-URL playback checks. */
export const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
  '.opus',
  '.flac',
] as const

export function fileHasAllowedAudioExtension(filename: string): boolean {
  const lower = filename.toLowerCase()
  return ALLOWED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Only direct file URLs — suitable for <audio src>. */
export function parseDirectAudioUrl(raw: string): string | null {
  const u = tryParseHttpUrl(raw)
  if (!u) return null
  const key = `${u.pathname.toLowerCase()}${u.search.toLowerCase()}`
  if (AUDIO_EXT.test(key)) return raw.trim()
  return null
}

export function normalizedGalleryUrls(urls: string[]): string[] {
  return urls.map((u) => u.trim()).filter(Boolean)
}
