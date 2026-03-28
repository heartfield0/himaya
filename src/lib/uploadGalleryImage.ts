import { FirebaseError } from 'firebase/app'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { formatStorageUploadError, safeSlugForStoragePath, sanitizeUploadFilename } from './uploadAudio'
import { storage } from './firebase'

const LOG = '[Himaya Storage]'

const MAX_BYTES = 15 * 1024 * 1024

export const ALLOWED_GALLERY_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

function fileHasAllowedGalleryImageExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ALLOWED_GALLERY_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function guessGalleryImageContentType(file: File): string {
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
export function validateGalleryImageFileForUpload(file: File): string | null {
  if (!fileHasAllowedGalleryImageExtension(file.name)) {
    return `Use an image file: ${ALLOWED_GALLERY_IMAGE_EXTENSIONS.join(', ')}`
  }
  if (file.type && !file.type.startsWith('image/')) {
    return 'This file does not look like an image.'
  }
  if (file.size > MAX_BYTES) {
    return 'Each gallery image must be 15 MB or smaller.'
  }
  return null
}

/**
 * Uploads to Storage and returns a download URL for the `gallery` string array.
 * Path: messages/{slug}/gallery/{timestamp}-{safeFilename}
 */
export async function uploadGalleryImage(file: File, slugForPath: string): Promise<string> {
  const invalid = validateGalleryImageFileForUpload(file)
  if (invalid) throw new Error(invalid)

  const slug = safeSlugForStoragePath(slugForPath)
  const ts = Date.now()
  const safeName = sanitizeUploadFilename(file.name, 'image')
  const objectPath = `messages/${slug}/gallery/${ts}-${safeName}`
  const storageRef = ref(storage, objectPath)
  const contentType = guessGalleryImageContentType(file)

  console.log(`${LOG} gallery image selected file`, {
    name: file.name,
    type: file.type || '(empty)',
    size: file.size,
    resolvedContentType: contentType,
  })
  console.log(`${LOG} gallery image storage path`, objectPath)
  console.log(`${LOG} gallery image upload start`)

  try {
    await uploadBytes(storageRef, file, { contentType })
    console.log(`${LOG} gallery image upload bytes success`)

    const url = await getDownloadURL(storageRef)
    console.log(`${LOG} gallery image download URL`, url)
    return url
  } catch (err) {
    console.error(`${LOG} gallery image upload failed`, err)
    if (err instanceof FirebaseError) {
      console.error(`${LOG} Firebase code`, err.code, 'message', err.message)
    }
    throw new Error(formatStorageUploadError(err))
  }
}
