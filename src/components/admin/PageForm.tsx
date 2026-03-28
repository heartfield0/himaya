import { useCallback, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { parseDirectAudioUrl, parseVideoUrl } from '../../lib/mediaUrls'
import {
  formatStorageUploadError,
  uploadMessageMusic,
  validateAudioFileForUpload,
} from '../../lib/uploadAudio'
import type { CustomerPage, PackageType, PageStatus } from '../../types/customerPage'

const AUDIO_INPUT_ACCEPT = '.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,audio/*'

function BackgroundMusicUpload({
  musicUrl,
  slugForPath,
  onMusicUrlChange,
}: {
  musicUrl: string
  slugForPath: string
  onMusicUrlChange: (url: string) => void
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
      <span className="form-field-inline-label">Background music</span>
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

      <p className="field-hint">
        &quot;Try music autoplay&quot; in Page settings is best-effort; browsers may block sound until the visitor taps play.
      </p>
    </div>
  )
}

interface PageFormProps {
  initial?: CustomerPage
  onSubmit: (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => void
}

const defaultForm: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'> = {
  slug: '',
  recipientName: '',
  senderName: '',
  occasion: '',
  packageType: 'basic',
  title: '',
  subtitle: '',
  shortMessage: '',
  longLetter: '',
  videoUrl: '',
  gallery: [],
  musicUrl: '',
  status: 'draft',
  unlockAt: null,
  themePreset: 'classic',
  passwordEnabled: false,
  timedUnlockEnabled: false,
  notifyOnOpen: true,
  musicAutoplay: false,
}

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function PageForm({ initial, onSubmit }: PageFormProps) {
  const [form, setForm] = useState<Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>>(
    initial
      ? {
          ...initial,
          unlockAt: initial.unlockAt,
        }
      : defaultForm,
  )
  const [galleryInput, setGalleryInput] = useState((initial?.gallery ?? []).join('\n'))

  const publicUrl = useMemo(() => {
    const slug = form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`)
    return `${window.location.origin}/m/${slug}`
  }, [form.slug, form.recipientName, form.occasion])

  const storageSlug = useMemo(
    () => form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`),
    [form.slug, form.recipientName, form.occasion],
  )

  const videoPresentation = useMemo(() => parseVideoUrl(form.videoUrl), [form.videoUrl])

  const setMusicUrl = useCallback((url: string) => {
    setForm((prev) => ({ ...prev, musicUrl: url }))
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const slug = form.slug || makeSlug(`${form.recipientName}-${form.occasion || 'gift'}`)

    onSubmit({
      ...form,
      slug,
      gallery: galleryInput
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      unlockAt: form.unlockAt || null,
    })
  }

  return (
    <form className="page-form" onSubmit={submit}>
      <section className="form-card">
        <p className="eyebrow">Section A</p>
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
          <label>
            Occasion
            <input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} required />
          </label>
          <label>
            Package Tier
            <select value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value as PackageType })}>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
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
        <p className="eyebrow">Section B</p>
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

      <section className="form-card">
        <p className="eyebrow">Section C</p>
        <h3>Media</h3>
        <div className="form-grid">
          <div className="form-field-stack">
            <label className="form-field-stack form-field-inline-label">
              Video URL
              <input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="YouTube link or direct .mp4 / .webm URL"
              />
              <span className="field-hint">Leave blank to hide video. YouTube watch, embed, Shorts, or a direct file URL.</span>
            </label>
            <div className="admin-video-preview" aria-live="polite">
              {videoPresentation ? (
                videoPresentation.kind === 'youtube' ? (
                  <div className="video-frame video-frame-mini">
                    <iframe
                      src={videoPresentation.embedSrc}
                      title="Video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="video-frame video-frame-mini video-frame-native">
                    <video src={videoPresentation.src} controls playsInline preload="metadata" />
                  </div>
                )
              ) : form.videoUrl.trim() ? (
                <p className="field-hint field-hint-warn">
                  This URL is not recognized as YouTube or a direct video file (.mp4, .webm, .ogg, .mov). Visitors will not see a video block until you use a supported link.
                </p>
              ) : (
                <p className="field-hint">Preview appears when you paste a supported URL.</p>
              )}
            </div>
          </div>
          <BackgroundMusicUpload musicUrl={form.musicUrl} slugForPath={storageSlug} onMusicUrlChange={setMusicUrl} />
        </div>
        <label className="form-field-stack">
          Gallery image URLs (one per line)
          <textarea rows={5} value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} placeholder="https://..." />
          <span className="field-hint">Leave blank to hide the gallery. Each non-empty line becomes one image.</span>
        </label>
      </section>

      <section className="form-card">
        <p className="eyebrow">Section D</p>
        <h3>Page Settings</h3>
        <div className="form-grid">
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PageStatus })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            Unlock Date (Optional)
            <input
              type="datetime-local"
              value={form.unlockAt ? form.unlockAt.slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, unlockAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </label>
          <label>
            Custom Slug (Optional)
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: makeSlug(e.target.value) })} />
          </label>
          <label>
            Theme Preset
            <select value={form.themePreset} onChange={(e) => setForm({ ...form, themePreset: e.target.value as CustomerPage['themePreset'] })}>
              <option value="classic">Classic</option>
              <option value="rose">Rose</option>
              <option value="warm-minimal">Warm Minimal</option>
            </select>
          </label>
        </div>
        <div className="feature-toggles">
          <label><input type="checkbox" checked={form.passwordEnabled} onChange={(e) => setForm({ ...form, passwordEnabled: e.target.checked })} /> Password protected (future)</label>
          <label><input type="checkbox" checked={form.timedUnlockEnabled} onChange={(e) => setForm({ ...form, timedUnlockEnabled: e.target.checked })} /> Timed unlock mode</label>
          <label><input type="checkbox" checked={form.notifyOnOpen} onChange={(e) => setForm({ ...form, notifyOnOpen: e.target.checked })} /> Notify admin on open</label>
          <label>
            <input type="checkbox" checked={form.musicAutoplay} onChange={(e) => setForm({ ...form, musicAutoplay: e.target.checked })} />
            Try music autoplay on open
          </label>
        </div>
        <p className="field-hint feature-toggles-hint">
          Autoplay only applies when background music is set in Media. Guests can always use the on-page music control.
        </p>
      </section>

      <section className="form-card output-card">
        <p className="eyebrow">Section E</p>
        <h3>Output</h3>
        <div className="output-grid">
          <div>
            <p className="muted">Public URL</p>
            <p className="public-url">{publicUrl}</p>
            <div className="inline-actions">
              <button type="button" className="secondary-btn" onClick={() => navigator.clipboard.writeText(publicUrl)}>Copy Link</button>
              <button type="button" className="secondary-btn" disabled>Download QR (placeholder)</button>
            </div>
          </div>
          <div className="qr-preview">
            <QRCodeCanvas value={publicUrl} size={120} bgColor="#fff9f2" fgColor="#5f4738" />
          </div>
        </div>
      </section>

      <button className="primary-btn" type="submit">Save Customer Page</button>
    </form>
  )
}
