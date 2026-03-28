import { FirebaseError } from 'firebase/app'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { formatStorageUploadError, safeSlugForStoragePath, sanitizeUploadFilename } from './uploadAudio'
import { storage } from './firebase'

const LOG = '[Himaya Storage]'

const MAX_BYTES = 15 * 1024 * 1024

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

function fileHasAllowedImageExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function guessImageContentType(file: File): string {
  if (file.type && file.type.startsWith('image/')) {
    return file.type
  }
  const n = file.name.toLowerCase()
  const byExt: [string, string][] = [
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webp', 'image/webp'],
  ]
  for (const [ext, mime] of byExt) {
    if (n.endsWith(ext)) return mime
  }
  return 'image/jpeg'
}

/** Returns an error message, or null if the file is acceptable. */
export function validateThemeBackgroundFile(file: File): string | null {
  if (!fileHasAllowedImageExtension(file.name)) {
    return `Use an image file: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
  }
  if (file.type && !file.type.startsWith('image/')) {
    return 'This file does not look like an image.'
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be 15 MB or smaller.'
  }
  return null
}

/**
 * Uploads to Storage and returns the download URL for `themeBackgroundImageUrl`.
 * Path: messages/{slug}/theme/{timestamp}-{safeFilename}
 */
export async function uploadThemeBackgroundImage(file: File, slugForPath: string): Promise<string> {
  const invalid = validateThemeBackgroundFile(file)
  if (invalid) throw new Error(invalid)

  const slug = safeSlugForStoragePath(slugForPath)
  const ts = Date.now()
  const safeName = sanitizeUploadFilename(file.name)
  const objectPath = `messages/${slug}/theme/${ts}-${safeName}`
  const storageRef = ref(storage, objectPath)
  const contentType = guessImageContentType(file)

  console.log(`${LOG} theme bg selected file`, {
    name: file.name,
    type: file.type || '(empty)',
    size: file.size,
    resolvedContentType: contentType,
  })
  console.log(`${LOG} theme bg storage path`, objectPath)

  try {
    await uploadBytes(storageRef, file, { contentType })
    const url = await getDownloadURL(storageRef)
    console.log(`${LOG} theme bg download URL`, url)
    return url
  } catch (err) {
    console.error(`${LOG} theme bg upload failed`, err)
    if (err instanceof FirebaseError) {
      console.error(`${LOG} Firebase code`, err.code, 'message', err.message)
    }
    throw new Error(formatStorageUploadError(err))
  }
}
