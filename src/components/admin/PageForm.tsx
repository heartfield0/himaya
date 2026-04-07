import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { normalizedGalleryUrls, parseDirectAudioUrl, parseVideoUrl } from '../../lib/mediaUrls'
import {
  accentPickerDisplayValue,
  normalizeAccentForStorage,
  parseHexColor,
} from '../../lib/themeAccent'
import {
  ALLOWED_GALLERY_IMAGE_EXTENSIONS,
  uploadGalleryImage,
  validateGalleryImageFileForUpload,
} from '../../lib/uploadGalleryImage'
import {
  uploadMessageVideo,
  validateMessageVideoFileForUpload,
} from '../../lib/uploadMessageVideo'
import {
  formatStorageUploadError,
  uploadMessageMusic,
  validateAudioFileForUpload,
} from '../../lib/uploadAudio'
import {
  uploadThemeBackgroundImage,
  validateThemeBackgroundFile,
} from '../../lib/uploadThemeBackground'
import { OCCASION_SEAL_CHOICES, suggestOccasionSealIcon } from '../../lib/occasionSealIcon'
import { THEME_PRESET_LABEL } from '../../lib/adminContentLabels'
import {
  CUSTOMER_PAGE_FORM_DEFAULTS,
  customerPageToFormState,
  type CustomerPageFormState,
} from '../../lib/pageTemplateMapping'
import { clipGalleryUrlsForTier, getPackageCapabilities, effectiveThemePreset } from '../../lib/packageCapabilities'
import type { CustomerPage, PackageType, PageStatus } from '../../types/customerPage'
import CustomerEditAdminPanel from './CustomerEditAdminPanel'
import PrintCardModal from './PrintCardModal'
import SaveTemplateModal from './SaveTemplateModal'

const AUDIO_INPUT_ACCEPT = '.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,audio/*'
const THEME_BG_INPUT_ACCEPT = '.png,.jpg,.jpeg,.webp,image/*'
const GALLERY_INPUT_ACCEPT = `${ALLOWED_GALLERY_IMAGE_EXTENSIONS.join(',')},image/*`
const MESSAGE_VIDEO_INPUT_ACCEPT = '.mp4,.webm,.ogg,.ogv,.mov,video/*'

function BackgroundMusicUpload({
  musicUrl,
  slugForPath,
  onMusicUrlChange,
  showAutoplayHint = true,
  showFieldLabel = true,
}: {
  musicUrl: string
  slugForPath: string
  onMusicUrlChange: (url: string) => void
  /** Hide when the current tier does not offer autoplay (hint only references Page settings). */
  showAutoplayHint?: boolean
  /** Omit when the parent section heading already names this control (e.g. Basic tier). */
  showFieldLabel?: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const recognizedMusicUrl = useMemo(() => parseDirectAudioUrl(musicUrl), [musicUrl])

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      const invalid = validateAudioFileForUpload(file)
      if (invalid) {
        setError(invalid)
        return
      }
      setIsUploading(true)
      try {
        console.log('[Himaya Storage] PageForm awaiting upload', {
          name: file.name,
          type: file.type || '(empty)',
          size: file.size,
          slugForPath,
        })
        const url = await uploadMessageMusic(file, slugForPath)
        onMusicUrlChange(url)
        console.log('[Himaya Storage] PageForm musicUrl updated')
      } catch (e) {
        const message = formatStorageUploadError(e)
        console.error('[Himaya Storage] PageForm caught error', e)
        setError(message)
      } finally {
        setIsUploading(false)
      }
    },
    [slugForPath, onMusicUrlChange],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void processFile(file)
  }

  const openPicker = () => {
    if (!isUploading) inputRef.current?.click()
  }

  return (
    <div className="form-field-stack">
      {showFieldLabel ? <span className="form-field-inline-label">Background music</span> : null}
      <span className="field-hint">
        Upload an audio file for the public page. Drag and drop here or choose a file. The link is stored as your page&apos;s music URL.
      </span>

      <div className="audio-dropzone-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={AUDIO_INPUT_ACCEPT}
          className="audio-file-input"
          onChange={onInputChange}
          aria-label="Choose audio file"
        />
        <div
          className={`audio-dropzone${isDragging ? ' audio-dropzone--active' : ''}${isUploading ? ' audio-dropzone--uploading' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isUploading) return
            dragDepth.current += 1
            setIsDragging(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!isUploading) e.dataTransfer.dropEffect = 'copy'
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dragDepth.current = Math.max(0, dragDepth.current - 1)
            if (dragDepth.current === 0) setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dragDepth.current = 0
            setIsDragging(false)
            if (isUploading) return
            const file = e.dataTransfer.files?.[0]
            if (file) void processFile(file)
          }}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openPicker()
            }
          }}
          role="button"
          tabIndex={0}
          aria-busy={isUploading}
        >
          {isUploading ? (
            <p className="audio-upload-status">Uploading…</p>
          ) : (
            <p className="audio-dropzone-text">
              Drop audio here or <span className="audio-dropzone-em">choose a file</span>
            </p>
          )}
          <p className="field-hint audio-dropzone-formats">.mp3, .wav, .m4a, .aac, .ogg, .opus, .flac</p>
        </div>
      </div>

      {error ? <p className="field-hint field-hint-warn">{error}</p> : null}

      {musicUrl.trim() ? (
        <>
          <audio
            key={musicUrl}
            className="admin-audio-preview"
            src={musicUrl}
            controls
            preload="metadata"
          />
          <div className="audio-upload-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={(e) => {
                e.stopPropagation()
                openPicker()
              }}
            >
              Replace file
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={(e) => {
                e.stopPropagation()
                setError(null)
                onMusicUrlChange('')
              }}
            >
              Remove music
            </button>
          </div>
          <p className="field-hint audio-url-readonly" title={musicUrl}>
            {musicUrl}
          </p>
        </>
      ) : null}

      {musicUrl.trim() && !recognizedMusicUrl ? (
        <p className="field-hint field-hint-warn">
          This URL may not be treated as direct audio on the public page. Re-upload if guests cannot hear the track.
        </p>
      ) : null}

      {showAutoplayHint ? (
        <p className="field-hint">
          &quot;Try music autoplay&quot; in Page settings is best-effort; browsers may block sound until the visitor taps play.
        </p>
      ) : null}
    </div>
  )
}

function ThemeBackgroundUpload({
  imageUrl,
  slugForPath,
  onImageUrlChange,
}: {
  imageUrl: string
  slugForPath: string
  onImageUrlChange: (url: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      const invalid = validateThemeBackgroundFile(file)
      if (invalid) {
        setError(invalid)
        return
      }
      setIsUploading(true)
      try {
        const url = await uploadThemeBackgroundImage(file, slugForPath)
        onImageUrlChange(url)
      } catch (e) {
        setError(formatStorageUploadError(e))
        console.error('[Himaya Storage] Theme background upload failed', e)
      } finally {
        setIsUploading(false)
      }
    },
    [slugForPath, onImageUrlChange],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void processFile(file)
  }

  const openPicker = () => {
    if (!isUploading) inputRef.current?.click()
  }

  return (
    <div className="form-field-stack">
      <span className="form-field-inline-label">Page background image</span>
      <span className="field-hint">
        Full-page backdrop on the public gift page (cover, centered). PNG or JPG from Canva works well. Drag and drop or choose a file.
      </span>
      <div className="audio-dropzone-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={THEME_BG_INPUT_ACCEPT}
          className="audio-file-input"
          onChange={onInputChange}
          aria-label="Choose background image"
        />
        <div
          className={`audio-dropzone${isDragging ? ' audio-dropzone--active' : ''}${isUploading ? ' audio-dropzone--uploading' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isUploading) return
            dragDepth.current += 1
            setIsDragging(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!isUploading) e.dataTransfer.dropEffect = 'copy'
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dragDepth.current = Math.max(0, dragDepth.current - 1)
            if (dragDepth.current === 0) setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dragDepth.current = 0
            setIsDragging(false)
            if (isUploading) return
            const file = e.dataTransfer.files?.[0]
            if (file) void processFile(file)
          }}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openPicker()
            }
          }}
          role="button"
          tabIndex={0}
          aria-busy={isUploading}
        >
          {isUploading ? (
            <p className="audio-upload-status">Uploading…</p>
          ) : (
            <p className="audio-dropzone-text">
              Drop image here or <span className="audio-dropzone-em">choose a file</span>
            </p>
          )}
          <p className="field-hint audio-dropzone-formats">.png, .jpg, .jpeg, .webp · max 15 MB</p>
        </div>
      </div>
      {error ? <p className="field-hint field-hint-warn">{error}</p> : null}
      {imageUrl.trim() ? (
        <>
          <div className="theme-bg-preview-wrap">
            <img src={imageUrl} alt="" className="theme-bg-preview-thumb" decoding="async" />
          </div>
          <div className="audio-upload-actions">
            <button type="button" className="secondary-btn" onClick={(e) => { e.stopPropagation(); openPicker() }}>
              Replace image
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={(e) => {
                e.stopPropagation()
                setError(null)
                onImageUrlChange('')
              }}
            >
              Remove background
            </button>
          </div>
          <p className="field-hint audio-url-readonly" title={imageUrl}>
            {imageUrl}
          </p>
        </>
      ) : null}
    </div>
  )
}

function MessageVideoUpload({
  videoUrl,
  slugForPath,
  onVideoUrlChange,
}: {
  videoUrl: string
  slugForPath: string
  onVideoUrlChange: (url: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const presentation = useMemo(() => parseVideoUrl(videoUrl.trim()), [videoUrl])

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      const invalid = validateMessageVideoFileForUpload(file)
      if (invalid) {
        setError(invalid)
        return
      }
      setIsUploading(true)
      try {
        console.log('[Himaya Admin] message video upload requested', {
          name: file.name,
          type: file.type || '(empty)',
          size: file.size,
          slugForPath,
        })
        const url = await uploadMessageVideo(file, slugForPath)
        onVideoUrlChange(url)
        console.log('[Himaya Admin] message video URL saved to form')
      } catch (e) {
        const message = formatStorageUploadError(e)
        console.error('[Himaya Admin] message video upload failed', e)
        setError(message)
      } finally {
        setIsUploading(false)
      }
    },
    [slugForPath, onVideoUrlChange],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void processFile(file)
  }

  const openPicker = () => {
    if (!isUploading) inputRef.current?.click()
  }

  const hasVideo = Boolean(videoUrl.trim())

  return (
    <div className="form-field-stack admin-message-video">
      <span className="form-field-inline-label">Video message</span>
      <span className="field-hint">
        Upload one video file for the public page (Standard &amp; Premium: one video). Drag and drop or choose a file. Firebase Storage returns a direct link compatible with the existing player.
      </span>

      <div className="audio-dropzone-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={MESSAGE_VIDEO_INPUT_ACCEPT}
          className="audio-file-input"
          onChange={onInputChange}
          aria-label="Choose video file"
        />
        {!hasVideo ? (
          <div
            className={`audio-dropzone${isDragging ? ' audio-dropzone--active' : ''}${isUploading ? ' audio-dropzone--uploading' : ''}`}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isUploading) return
              dragDepth.current += 1
              setIsDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!isUploading) e.dataTransfer.dropEffect = 'copy'
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              dragDepth.current = Math.max(0, dragDepth.current - 1)
              if (dragDepth.current === 0) setIsDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              dragDepth.current = 0
              setIsDragging(false)
              if (isUploading) return
              const file = e.dataTransfer.files?.[0]
              if (file) void processFile(file)
            }}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPicker()
              }
            }}
            role="button"
            tabIndex={0}
            aria-busy={isUploading}
          >
            {isUploading ? (
              <p className="audio-upload-status">Uploading video…</p>
            ) : (
              <p className="audio-dropzone-text">
                Drop video here or <span className="audio-dropzone-em">choose a file</span>
              </p>
            )}
            <p className="field-hint audio-dropzone-formats">.mp4, .webm, .ogg, .ogv, .mov · max 120 MB</p>
          </div>
        ) : null}
      </div>

      {error ? <p className="field-hint field-hint-warn">{error}</p> : null}

      {hasVideo ? (
        <div className="admin-video-preview admin-video-preview-block" aria-live="polite">
          {presentation?.kind === 'youtube' ? (
            <div className="video-frame video-frame-mini">
              <iframe
                src={presentation.embedSrc}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : presentation?.kind === 'direct' ? (
            <div className="video-frame video-frame-mini video-frame-native">
              <video src={presentation.src} controls playsInline preload="metadata" />
            </div>
          ) : (
            <p className="field-hint field-hint-warn">
              This saved URL is not recognized as YouTube or a direct video file. Remove it and upload again, or replace with a supported file.
            </p>
          )}
          <div className="audio-upload-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setError(null)
                openPicker()
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Replace video'}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setError(null)
                onVideoUrlChange('')
              }}
              disabled={isUploading}
            >
              Remove video
            </button>
          </div>
          <p className="field-hint audio-url-readonly" title={videoUrl}>
            {videoUrl}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function GalleryImagesUpload({
  urls,
  maxCount,
  slugForPath,
  onUrlsChange,
}: {
  urls: string[]
  maxCount: number
  slugForPath: string
  onUrlsChange: (next: string[]) => void
}) {
  const [isFileDropHighlight, setIsFileDropHighlight] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadLabel, setUploadLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [reorderDragIndex, setReorderDragIndex] = useState<number | null>(null)
  const [reorderOverIndex, setReorderOverIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const GALLERY_REORDER_MIME = 'application/x-himaya-gallery-index'

  const handleReorderDragStart = (index: number) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(GALLERY_REORDER_MIME, String(index))
    e.dataTransfer.setData('text/plain', String(index))
    setReorderDragIndex(index)
  }

  const handleReorderDragEnd = () => {
    setReorderDragIndex(null)
    setReorderOverIndex(null)
  }

  const handleReorderDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setReorderOverIndex(index)
  }

  const handleReorderDragLeave = () => {
    setReorderOverIndex(null)
  }

  const handleReorderDrop = (dropIndex: number) => (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      handleReorderDragEnd()
      return
    }
    const raw = e.dataTransfer.getData(GALLERY_REORDER_MIME) || e.dataTransfer.getData('text/plain')
    const from = Number.parseInt(raw, 10)
    if (Number.isNaN(from) || from < 0 || from >= list.length) {
      handleReorderDragEnd()
      return
    }
    if (from === dropIndex) {
      handleReorderDragEnd()
      return
    }
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(dropIndex, 0, item)
    onUrlsChange(next)
    handleReorderDragEnd()
  }

  const list = useMemo(() => normalizedGalleryUrls(urls), [urls])
  const remaining = Math.max(0, maxCount - list.length)

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.size > 0)
      if (files.length === 0) return

      setError(null)
      setHint(null)

      const room = maxCount - list.length
      if (room <= 0) {
        setError(`Gallery is full for this tier (${maxCount} images max). Remove an image to add more.`)
        return
      }

      const toUpload = files.slice(0, room)
      if (files.length > room) {
        setHint(`${files.length - room} file(s) skipped — tier allows ${maxCount} images total (${list.length} already saved).`)
      }

      setIsUploading(true)
      let acc = [...list]

      try {
        for (let i = 0; i < toUpload.length; i++) {
          const file = toUpload[i]
          setUploadLabel(`Uploading ${i + 1} of ${toUpload.length}…`)
          const invalid = validateGalleryImageFileForUpload(file)
          if (invalid) {
            setError(invalid)
            break
          }
          console.log('[Himaya Admin] gallery image upload requested', {
            name: file.name,
            index: i + 1,
            of: toUpload.length,
            slugForPath,
          })
          const url = await uploadGalleryImage(file, slugForPath)
          acc = [...acc, url]
          onUrlsChange(acc)
          console.log('[Himaya Admin] gallery image appended, count', acc.length)
        }
      } catch (e) {
        const message = formatStorageUploadError(e)
        console.error('[Himaya Admin] gallery batch upload failed', e)
        setError(message)
      } finally {
        setIsUploading(false)
        setUploadLabel(null)
      }
    },
    [list, maxCount, onUrlsChange, slugForPath],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files
    e.target.value = ''
    if (fl?.length) void processFiles(fl)
  }

  const openPicker = () => {
    if (!isUploading && remaining > 0) inputRef.current?.click()
  }

  const removeAt = (index: number) => {
    const next = list.filter((_, i) => i !== index)
    onUrlsChange(next)
    setError(null)
    setHint(null)
  }

  return (
    <div className="form-field-stack admin-gallery-upload">
      <span className="form-field-inline-label">Gallery images</span>
      <span className="field-hint">
        Upload up to {maxCount} images for this tier. Drag files onto the drop zone to add them. Drag thumbnails to reorder — order is saved with the page.
      </span>

      {list.length > 0 ? (
        <>
          <p className="field-hint admin-gallery-drag-hint">Drag any thumbnail to change the gallery order on the public page.</p>
          <ul className="admin-gallery-grid" aria-label="Uploaded gallery images">
            {list.map((url, index) => (
              <li
                key={`${url}::${index}`}
                className={`admin-gallery-tile${reorderDragIndex === index ? ' admin-gallery-tile--dragging' : ''}${reorderOverIndex === index ? ' admin-gallery-tile--over' : ''}`}
                draggable
                onDragStart={handleReorderDragStart(index)}
                onDragEnd={handleReorderDragEnd}
                onDragOver={handleReorderDragOver(index)}
                onDragLeave={handleReorderDragLeave}
                onDrop={handleReorderDrop(index)}
              >
                <div className="admin-gallery-thumb-wrap">
                  <img src={url} alt="" className="admin-gallery-thumb" decoding="async" loading="lazy" draggable={false} />
                </div>
                <button
                  type="button"
                  className="ghost-btn admin-gallery-remove"
                  draggable={false}
                  onClick={() => removeAt(index)}
                  aria-label={`Remove image ${index + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {remaining > 0 ? (
        <div className="audio-dropzone-wrap">
          <input
            ref={inputRef}
            type="file"
            accept={GALLERY_INPUT_ACCEPT}
            className="audio-file-input"
            onChange={onInputChange}
            aria-label="Choose gallery images"
            multiple
          />
          <div
            className={`audio-dropzone${isFileDropHighlight ? ' audio-dropzone--active' : ''}${isUploading ? ' audio-dropzone--uploading' : ''}`}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isUploading) return
              dragDepth.current += 1
              setIsFileDropHighlight(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!isUploading) e.dataTransfer.dropEffect = 'copy'
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              dragDepth.current = Math.max(0, dragDepth.current - 1)
              if (dragDepth.current === 0) setIsFileDropHighlight(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              dragDepth.current = 0
              setIsFileDropHighlight(false)
              if (isUploading) return
              if (e.dataTransfer.files?.length) void processFiles(e.dataTransfer.files)
            }}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPicker()
              }
            }}
            role="button"
            tabIndex={0}
            aria-busy={isUploading}
          >
            {isUploading ? (
              <p className="audio-upload-status">{uploadLabel ?? 'Uploading…'}</p>
            ) : (
              <p className="audio-dropzone-text">
                Drop images here or <span className="audio-dropzone-em">choose files</span>
              </p>
            )}
            <p className="field-hint audio-dropzone-formats">
              {ALLOWED_GALLERY_IMAGE_EXTENSIONS.join(', ')} · max 15 MB each · {remaining} slot
              {remaining === 1 ? '' : 's'} left
            </p>
          </div>
        </div>
      ) : (
        <p className="field-hint">Gallery is full ({maxCount} images). Remove one to upload more.</p>
      )}

      {error ? <p className="field-hint field-hint-warn">{error}</p> : null}
      {hint ? <p className="field-hint field-hint-warn">{hint}</p> : null}
    </div>
  )
}

interface PageFormProps {
  initialCustomerPage?: CustomerPage
  initialFormSeed?: CustomerPageFormState
  enableSaveAsTemplate?: boolean
  onSubmit: (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => void
}

function getInitialFormState(
  page: CustomerPage | undefined,
  seed: CustomerPageFormState | undefined,
): CustomerPageFormState {
  if (page) return customerPageToFormState(page)
  if (seed) return seed
  return CUSTOMER_PAGE_FORM_DEFAULTS
}

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function PageForm({
  initialCustomerPage,
  initialFormSeed,
  enableSaveAsTemplate,
  onSubmit,
}: PageFormProps) {
  const [form, setForm] = useState<CustomerPageFormState>(() =>
    getInitialFormState(initialCustomerPage, initialFormSeed),
  )
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [printCardOpen, setPrintCardOpen] = useState(false)

  const patchForm = useCallback((patch: Partial<CustomerPageFormState>) => {
    setForm((f) => ({ ...f, ...patch }))
  }, [])

  const publicUrl = useMemo(() => {
    const slug = form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`)
    return `${window.location.origin}/m/${slug}`
  }, [form.slug, form.recipientName, form.occasion])

  const storageSlug = useMemo(
    () => form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`),
    [form.slug, form.recipientName, form.occasion],
  )

  const caps = useMemo(() => getPackageCapabilities(form.packageType), [form.packageType])

  const setMusicUrl = useCallback((url: string) => {
    setForm((prev) => ({ ...prev, musicUrl: url }))
  }, [])

  const setVideoUrl = useCallback((url: string) => {
    setForm((prev) => ({ ...prev, videoUrl: url }))
  }, [])

  const prevOccasionForSealRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevOccasionForSealRef.current
    if (prev === null) {
      prevOccasionForSealRef.current = form.occasion
      return
    }
    const prevSuggested = suggestOccasionSealIcon(prev)
    if (form.occasionIcon !== prevSuggested) {
      prevOccasionForSealRef.current = form.occasion
      return
    }
    const nextSuggested = suggestOccasionSealIcon(form.occasion)
    if (nextSuggested !== form.occasionIcon) {
      setForm((f) => ({ ...f, occasionIcon: nextSuggested }))
    }
    prevOccasionForSealRef.current = form.occasion
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when occasion text changes; comparing icon to prior suggestion uses current form.occasionIcon intentionally
  }, [form.occasion])

  useLayoutEffect(() => {
    const allowed = getPackageCapabilities(form.packageType).themePresets
    if ((allowed as readonly string[]).includes(form.themePreset)) return
    setForm((f) => ({
      ...f,
      themePreset: (allowed[0] ?? 'classic') as CustomerPage['themePreset'],
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time hydrate when stored theme does not match tier
  }, [])

  const showVideoField = caps.video
  const showGalleryField = caps.maxGalleryImages > 0
  const showMusicField = caps.music
  const showAnyMedia = showVideoField || showGalleryField || showMusicField
  const showThemePicker = caps.themePresets.length > 1
  const showSettingsToggles =
    caps.passwordToggle || caps.timedUnlockToggle || caps.notifyOnOpen || caps.musicAutoplay

  const mediaSectionTitle = (() => {
    if (!showAnyMedia) return 'Media'
    const v = showVideoField
    const g = showGalleryField
    const m = showMusicField
    if (v && g && m) return 'Media'
    if (v && m && !g) return 'Video & music'
    if (v && g && !m) return 'Video & gallery'
    if (m && g && !v) return 'Music & gallery'
    if (v && !g && !m) return 'Video message'
    if (g && !v && !m) return 'Gallery'
    if (m && !v && !g) return 'Background music'
    return 'Media'
  })()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const slug = form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`)

    const capsSubmit = getPackageCapabilities(form.packageType)
    onSubmit({
      ...form,
      slug,
      themePreset: effectiveThemePreset(form.packageType, form.themePreset),
      gallery: clipGalleryUrlsForTier(form.packageType, normalizedGalleryUrls(form.gallery)),
      unlockAt: form.unlockAt || null,
      themeAccentColor: capsSubmit.customThemeBuilder ? normalizeAccentForStorage(form.themeAccentColor) : '',
      themeBackgroundImageUrl: capsSubmit.customThemeBuilder ? form.themeBackgroundImageUrl.trim() : '',
      occasionIcon: capsSubmit.occasionSealIconPicker ? form.occasionIcon : 'heart',
      passwordEnabled: capsSubmit.passwordToggle ? form.passwordEnabled : false,
      giftAccessPassword:
        capsSubmit.passwordToggle && form.passwordEnabled ? form.giftAccessPassword.trim() : '',
    })
  }

  return (
    <form className="page-form" onSubmit={submit}>
      <section className="form-card">
        <h3>Basic Info</h3>
        <div className="form-grid">
          <label>
            Recipient Name
            <input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required />
          </label>
          <label>
            Sender Name
            <input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} required />
          </label>
          <label className="form-field-stack">
            Occasion
            <input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} required />
            {!caps.occasionSealIconPicker ? (
              <span className="field-hint">
                Standard and Premium can pick a custom icon on the envelope seal for the gift intro.
              </span>
            ) : (
              <span className="field-hint">
                The seal icon updates automatically from this line when it still matches the last suggestion — change the dropdown below to override.
              </span>
            )}
          </label>
          {caps.occasionSealIconPicker ? (
            <label>
              Occasion icon (envelope seal)
              <select
                value={form.occasionIcon}
                onChange={(e) =>
                  setForm({ ...form, occasionIcon: e.target.value as CustomerPage['occasionIcon'] })
                }
              >
                {OCCASION_SEAL_CHOICES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="form-field-stack">
            Package Tier
            <select
              value={form.packageType}
              onChange={(e) => {
                const nextTier = e.target.value as PackageType
                const allow = getPackageCapabilities(nextTier).themePresets
                setForm((f) => {
                  const nextCaps = getPackageCapabilities(nextTier)
                  return {
                    ...f,
                    packageType: nextTier,
                    themePreset: (allow as readonly string[]).includes(f.themePreset)
                      ? f.themePreset
                      : ((allow[0] ?? 'classic') as CustomerPage['themePreset']),
                    occasionIcon: nextCaps.occasionSealIconPicker ? f.occasionIcon : 'heart',
                    gallery: clipGalleryUrlsForTier(nextTier, normalizedGalleryUrls(f.gallery)),
                    passwordEnabled: nextCaps.passwordToggle ? f.passwordEnabled : false,
                    giftAccessPassword: nextCaps.passwordToggle ? f.giftAccessPassword : '',
                  }
                })
              }}
            >
              <option value="basic">Basic — ₱100 add-on</option>
              <option value="standard">Standard — ₱150</option>
              <option value="premium">Premium — ₱250</option>
            </select>
            <span className="field-hint">
              Basic = ₱100 add-on · Standard = ₱150 · Premium = ₱250
            </span>
          </label>
          <label>
            Page Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Short Subtitle
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </label>
        </div>
      </section>

      <section className="form-card">
        <h3>Message Content</h3>
        <label className="form-field-stack">
          Short message
          <textarea rows={3} value={form.shortMessage} onChange={(e) => setForm({ ...form, shortMessage: e.target.value })} />
          <span className="field-hint">Leave blank to hide the personal message block on the public page.</span>
        </label>
        <label className="form-field-stack">
          Full letter
          <textarea rows={8} value={form.longLetter} onChange={(e) => setForm({ ...form, longLetter: e.target.value })} />
          <span className="field-hint">Leave blank to hide the letter section.</span>
        </label>
      </section>

      {showAnyMedia ? (
        <section className="form-card">
          <h3>{mediaSectionTitle}</h3>
          {showVideoField || showMusicField ? (
            <div className="form-grid">
              {showVideoField ? (
                <MessageVideoUpload
                  videoUrl={form.videoUrl}
                  slugForPath={storageSlug}
                  onVideoUrlChange={setVideoUrl}
                />
              ) : null}
              {showMusicField ? (
                <BackgroundMusicUpload
                  musicUrl={form.musicUrl}
                  slugForPath={storageSlug}
                  onMusicUrlChange={setMusicUrl}
                  showAutoplayHint={caps.musicAutoplay}
                  showFieldLabel={showVideoField || showGalleryField}
                />
              ) : null}
            </div>
          ) : null}
          {showGalleryField ? (
            <GalleryImagesUpload
              urls={form.gallery}
              maxCount={caps.maxGalleryImages}
              slugForPath={storageSlug}
              onUrlsChange={(next) => setForm((f) => ({ ...f, gallery: next }))}
            />
          ) : null}
        </section>
      ) : null}

      <section className="form-card">
        <h3>Page Settings</h3>
        <div className="form-grid page-settings-grid">
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PageStatus })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          {caps.unlockDateField ? (
            <label>
              Unlock Date (Optional)
              <input
                type="datetime-local"
                value={form.unlockAt ? form.unlockAt.slice(0, 16) : ''}
                onChange={(e) => setForm({ ...form, unlockAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </label>
          ) : null}
          {caps.customSlug ? (
            <label>
              Custom Slug (Optional)
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: makeSlug(e.target.value) })} />
            </label>
          ) : null}
          {showThemePicker ? (
            <label>
              Theme Preset
              <select value={form.themePreset} onChange={(e) => setForm({ ...form, themePreset: e.target.value as CustomerPage['themePreset'] })}>
                {caps.themePresets.map((preset) => (
                  <option key={preset} value={preset}>
                    {THEME_PRESET_LABEL[preset]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {showSettingsToggles ? (
          <div className="page-settings-toggles" role="group" aria-label="Page options">
            {caps.passwordToggle ? (
              <div className="settings-password-block">
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    className="settings-toggle-input"
                    checked={form.passwordEnabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        passwordEnabled: e.target.checked,
                        giftAccessPassword: e.target.checked ? form.giftAccessPassword : '',
                      })
                    }
                  />
                  <span className="settings-toggle-body">
                    <span className="settings-toggle-title">Password protect this gift page</span>
                    <span className="settings-toggle-hint">
                      Premium only. Visitors enter your passphrase before they see the envelope, message, or media. Uses a simple browser check—fine for a private gift link, not for high-security secrets.
                    </span>
                  </span>
                </label>
                {form.passwordEnabled ? (
                  <label className="form-field-stack settings-password-field">
                    <span className="settings-password-label">Visitor passphrase</span>
                    <input
                      type="password"
                      value={form.giftAccessPassword}
                      onChange={(e) => setForm({ ...form, giftAccessPassword: e.target.value })}
                      autoComplete="new-password"
                      placeholder="Choose a memorable phrase"
                    />
                    <span className="field-hint">
                      Share this only with your recipient. If left empty while the toggle is on, the public page will not require a password.
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}
            {caps.timedUnlockToggle ? (
              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={form.timedUnlockEnabled}
                  onChange={(e) => setForm({ ...form, timedUnlockEnabled: e.target.checked })}
                />
                <span className="settings-toggle-body">
                  <span className="settings-toggle-title">Timed unlock mode</span>
                  <span className="settings-toggle-hint">Works with the unlock date above to control when content appears.</span>
                </span>
              </label>
            ) : null}
            {caps.notifyOnOpen ? (
              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={form.notifyOnOpen}
                  onChange={(e) => setForm({ ...form, notifyOnOpen: e.target.checked })}
                />
                <span className="settings-toggle-body">
                  <span className="settings-toggle-title">Notify admin on open</span>
                  <span className="settings-toggle-hint">Get notified when a recipient first opens the public page.</span>
                </span>
              </label>
            ) : null}
            {caps.musicAutoplay ? (
              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={form.musicAutoplay}
                  onChange={(e) => setForm({ ...form, musicAutoplay: e.target.checked })}
                />
                <span className="settings-toggle-body">
                  <span className="settings-toggle-title">Try music autoplay on open</span>
                  <span className="settings-toggle-hint">
                    Best-effort only; browsers may block audio until the visitor taps play. Applies when background music is set in Media.
                    Guests can always use the on-page music control.
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        ) : null}
      </section>

      {caps.customThemeBuilder ? (
        <section className="form-card">
          <h3>Custom theme</h3>
          <p className="field-hint theme-custom-lead">
            Premium only. Pick a preset above for the base look; optional accent and background override colors and add a full-page backdrop when set.
          </p>
          <div className="form-grid theme-custom-grid">
            <label className="form-field-stack">
              Accent color
              <div className="theme-accent-row">
                <input
                  type="color"
                  aria-label="Pick accent color"
                  value={accentPickerDisplayValue(form.themeAccentColor)}
                  onChange={(e) => setForm({ ...form, themeAccentColor: e.target.value })}
                  className="theme-accent-swatch"
                />
                <input
                  type="text"
                  placeholder="#c2766e"
                  value={form.themeAccentColor}
                  onChange={(e) => setForm({ ...form, themeAccentColor: e.target.value })}
                  className="theme-accent-hex-input"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="ghost-btn theme-accent-clear"
                  onClick={() => setForm({ ...form, themeAccentColor: '' })}
                >
                  Preset colors only
                </button>
              </div>
              <span className="field-hint">
                Affects headings, intro seal, Open Letter button, card borders, music dock, and soft shadows on the public page.
              </span>
            </label>
            <ThemeBackgroundUpload
              imageUrl={form.themeBackgroundImageUrl}
              slugForPath={storageSlug}
              onImageUrlChange={(url) => setForm({ ...form, themeBackgroundImageUrl: url })}
            />
          </div>
          {form.themeAccentColor.trim() && !parseHexColor(form.themeAccentColor.trim()) ? (
            <p className="field-hint field-hint-warn">Use a hex color like #c2766e or clear the field to rely on the preset.</p>
          ) : null}
        </section>
      ) : null}

      {initialCustomerPage?.id ? (
        <section className="form-card customer-edit-admin-wrap">
          <CustomerEditAdminPanel page={initialCustomerPage} />
        </section>
      ) : null}

      <section className="form-card output-card">
        <h3>Output</h3>
        <div className="output-grid">
          <div>
            <p className="muted">Public URL</p>
            <p className="public-url">{publicUrl}</p>
            <div className="inline-actions">
              <button type="button" className="secondary-btn" onClick={() => navigator.clipboard.writeText(publicUrl)}>
                Copy Link
              </button>
              <button type="button" className="secondary-btn" onClick={() => setPrintCardOpen(true)}>
                Generate Card
              </button>
            </div>
          </div>
          <div className="qr-preview">
            <QRCodeCanvas value={publicUrl} size={120} bgColor="#fff9f2" fgColor="#5f4738" />
          </div>
        </div>
      </section>

      <div className="page-form-actions">
        {enableSaveAsTemplate ? (
          <button
            type="button"
            className="secondary-btn page-form-action-secondary"
            onClick={() => setSaveTemplateOpen(true)}
          >
            Save as Template
          </button>
        ) : null}
        <button className="primary-btn page-form-action-primary" type="submit">
          Save Customer Page
        </button>
      </div>

      {enableSaveAsTemplate ? (
        <SaveTemplateModal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} form={form} />
      ) : null}

      <PrintCardModal
        open={printCardOpen}
        onClose={() => setPrintCardOpen(false)}
        publicUrl={publicUrl}
        slugForFile={form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`)}
        form={form}
        onFormPatch={patchForm}
      />
    </form>
  )
}
