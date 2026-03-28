import { FirebaseError } from 'firebase/app'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ALLOWED_AUDIO_EXTENSIONS, fileHasAllowedAudioExtension } from './mediaUrls'
import { storage } from './firebase'

const LOG = '[Himaya Storage]'

export function safeSlugForStoragePath(slug: string): string {
  const s = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return (s || 'untitled').slice(0, 96)
}

/** `emptyBasenameFallback` is used when the filename has no safe characters (e.g. `image`, `video`). */
export function sanitizeUploadFilename(name: string, emptyBasenameFallback = 'audio'): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '')
  return (base || emptyBasenameFallback).slice(0, 120)
}

function guessAudioContentType(file: File): string {
  if (file.type && file.type.startsWith('audio/')) {
    return file.type
  }
  const n = file.name.toLowerCase()
  const byExt: [string, string][] = [
    ['.mp3', 'audio/mpeg'],
    ['.wav', 'audio/wav'],
    ['.m4a', 'audio/mp4'],
    ['.aac', 'audio/aac'],
    ['.ogg', 'audio/ogg'],
    ['.opus', 'audio/opus'],
    ['.flac', 'audio/flac'],
  ]
  for (const [ext, mime] of byExt) {
    if (n.endsWith(ext)) return mime
  }
  return 'audio/mpeg'
}

/** Human-readable message for UI + logs. */
export function formatStorageUploadError(err: unknown): string {
  if (err instanceof FirebaseError) {
    return `${err.code}: ${err.message}`
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Upload failed: unknown error'
}

/** Returns an error message, or null if the file is acceptable. */
export function validateAudioFileForUpload(file: File): string | null {
  if (!fileHasAllowedAudioExtension(file.name)) {
    return `Use an audio file: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`
  }
  if (file.type && !file.type.startsWith('audio/')) {
    return 'This file does not look like audio.'
  }
  return null
}

/**
 * Uploads to Storage and returns the download URL for `musicUrl`.
 * Path: messages/{slug}/music/{timestamp}-{safeFilename}
 * Future: when replacing music, consider deleteObject() on the previous Storage path to avoid orphans.
 */
export async function uploadMessageMusic(file: File, slugForPath: string): Promise<string> {
  const invalid = validateAudioFileForUpload(file)
  if (invalid) throw new Error(invalid)

  const slug = safeSlugForStoragePath(slugForPath)
  const ts = Date.now()
  const safeName = sanitizeUploadFilename(file.name)
  const objectPath = `messages/${slug}/music/${ts}-${safeName}`
  const storageRef = ref(storage, objectPath)
  const contentType = guessAudioContentType(file)

  console.log(`${LOG} selected file`, {
    name: file.name,
    type: file.type || '(empty)',
    size: file.size,
    resolvedContentType: contentType,
  })
  console.log(`${LOG} storage path`, objectPath)
  console.log(`${LOG} upload start`)

  try {
    await uploadBytes(storageRef, file, { contentType })
    console.log(`${LOG} upload bytes success`)

    const url = await getDownloadURL(storageRef)
    console.log(`${LOG} download URL`, url)
    return url
  } catch (err) {
    console.error(`${LOG} upload failed`, err)
    if (err instanceof FirebaseError) {
      console.error(`${LOG} Firebase code`, err.code, 'message', err.message)
    }
    throw new Error(formatStorageUploadError(err))
  }
}
