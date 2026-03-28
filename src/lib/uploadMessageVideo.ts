import { FirebaseError } from 'firebase/app'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { formatStorageUploadError, safeSlugForStoragePath, sanitizeUploadFilename } from './uploadAudio'
import { storage } from './firebase'

const LOG = '[Himaya Storage]'

/** One HD-ish clip; adjust if product needs larger. */
const MAX_BYTES = 120 * 1024 * 1024

export const ALLOWED_MESSAGE_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov'] as const

function fileHasAllowedMessageVideoExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ALLOWED_MESSAGE_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function guessMessageVideoContentType(file: File): string {
  if (file.type && file.type.startsWith('video/')) {
    return file.type
  }
  const n = file.name.toLowerCase()
  const byExt: [string, string][] = [
    ['.mp4', 'video/mp4'],
    ['.webm', 'video/webm'],
    ['.ogg', 'video/ogg'],
    ['.ogv', 'video/ogg'],
    ['.mov', 'video/quicktime'],
  ]
  for (const [ext, mime] of byExt) {
    if (n.endsWith(ext)) return mime
  }
  return 'video/mp4'
}

/** Returns an error message, or null if the file is acceptable. */
export function validateMessageVideoFileForUpload(file: File): string | null {
  if (!fileHasAllowedMessageVideoExtension(file.name)) {
    return `Use a video file: ${ALLOWED_MESSAGE_VIDEO_EXTENSIONS.join(', ')}`
  }
  if (file.type && !file.type.startsWith('video/')) {
    return 'This file does not look like a video.'
  }
  if (file.size > MAX_BYTES) {
    return 'Video must be 120 MB or smaller.'
  }
  return null
}

/**
 * Uploads to Storage and returns the download URL for `videoUrl`.
 * Path: messages/{slug}/video/{timestamp}-{safeFilename}
 */
export async function uploadMessageVideo(file: File, slugForPath: string): Promise<string> {
  const invalid = validateMessageVideoFileForUpload(file)
  if (invalid) throw new Error(invalid)

  const slug = safeSlugForStoragePath(slugForPath)
  const ts = Date.now()
  const safeName = sanitizeUploadFilename(file.name, 'video')
  const objectPath = `messages/${slug}/video/${ts}-${safeName}`
  const storageRef = ref(storage, objectPath)
  const contentType = guessMessageVideoContentType(file)

  console.log(`${LOG} message video selected file`, {
    name: file.name,
    type: file.type || '(empty)',
    size: file.size,
    resolvedContentType: contentType,
  })
  console.log(`${LOG} message video storage path`, objectPath)
  console.log(`${LOG} message video upload start`)

  try {
    await uploadBytes(storageRef, file, { contentType })
    console.log(`${LOG} message video upload bytes success`)

    const url = await getDownloadURL(storageRef)
    console.log(`${LOG} message video download URL`, url)
    return url
  } catch (err) {
    console.error(`${LOG} message video upload failed`, err)
    if (err instanceof FirebaseError) {
      console.error(`${LOG} Firebase code`, err.code, 'message', err.message)
    }
    throw new Error(formatStorageUploadError(err))
  }
}
