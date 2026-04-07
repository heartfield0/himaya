import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Heart } from 'lucide-react'
import himayaMark from '../../assets/logo/himaya-mark.png'
import { THEME_PRESET_LABEL } from '../../lib/adminContentLabels'
import {
  clipGalleryUrlsForTier,
  effectiveThemePreset,
  getPackageCapabilities,
  publicMusicAutoplayAllowed,
} from '../../lib/packageCapabilities'
import { normalizedGalleryUrls, parseDirectAudioUrl } from '../../lib/mediaUrls'
import { pageRepository } from '../../lib/pageRepository'
import {
  formatStorageUploadError,
  uploadMessageMusic,
  validateAudioFileForUpload,
} from '../../lib/uploadAudio'
import {
  ALLOWED_GALLERY_IMAGE_EXTENSIONS,
  uploadGalleryImage,
  validateGalleryImageFileForUpload,
} from '../../lib/uploadGalleryImage'
import type { CustomerPage } from '../../types/customerPage'

const AUDIO_INPUT_ACCEPT = '.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,audio/*'
const GALLERY_INPUT_ACCEPT = `${ALLOWED_GALLERY_IMAGE_EXTENSIONS.join(',')},image/*`

export default function CustomerEditMessagePage() {
  const { slug: slugParam } = useParams()
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') ?? '').trim()

  const slug = slugParam?.trim() ?? ''

  const [page, setPage] = useState<CustomerPage | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [recipientName, setRecipientName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [shortMessage, setShortMessage] = useState('')
  const [longLetter, setLongLetter] = useState('')
  const [gallery, setGallery] = useState<string[]>([])
  const [themePreset, setThemePreset] = useState<CustomerPage['themePreset']>('classic')
  const [musicUrl, setMusicUrl] = useState('')
  const [musicAutoplay, setMusicAutoplay] = useState(false)

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const [musicBusy, setMusicBusy] = useState(false)
  const [galleryHint, setGalleryHint] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!slug || !token) {
        setIsLoading(false)
        setLoadError(!slug ? 'Missing page address.' : 'This link is missing its security token.')
        return
      }
      setIsLoading(true)
      setLoadError(null)
      try {
        const p = await pageRepository.getPublicBySlug(slug)
        if (!mounted) return
        if (!p) {
          setLoadError('We could not find an active Himaya page for this link.')
          setPage(null)
          return
        }
        if (!p.allowCustomerEdit) {
          setLoadError('Editing is not enabled for this page. Please contact your florist.')
          setPage(null)
          return
        }
        const expMs = p.customerEditExpiresAt ? new Date(p.customerEditExpiresAt).getTime() : NaN
        if (!Number.isNaN(expMs) && expMs < Date.now()) {
          setLoadError('This edit link has expired. Ask your florist for a new one.')
          setPage(null)
          return
        }
        setPage(p)
        setRecipientName(p.recipientName)
        setSenderName(p.senderName)
        setShortMessage(p.shortMessage)
        setLongLetter(p.longLetter)
        setGallery(normalizedGalleryUrls(p.gallery))
        setThemePreset(effectiveThemePreset(p.packageType, p.themePreset))
        setMusicUrl(p.musicUrl)
        setMusicAutoplay(p.musicAutoplay)
      } catch (e) {
        console.error(e)
        if (mounted) setLoadError('Could not load your page. Try again in a moment.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [slug, token])

  const caps = page ? getPackageCapabilities(page.packageType) : null
  const maxGallery = caps?.maxGalleryImages ?? 0
  const galleryList = useMemo(() => normalizedGalleryUrls(gallery), [gallery])
  const remainingSlots = Math.max(0, maxGallery - galleryList.length)

  const onGalleryFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!page || !slug || maxGallery <= 0) return
      const arr = Array.from(files).filter((f) => f.size > 0)
      if (arr.length === 0) return
      setGalleryHint(null)
      const room = maxGallery - normalizedGalleryUrls(gallery).length
      if (room <= 0) {
        setGalleryHint(`Your plan allows up to ${maxGallery} images. Remove one to add more.`)
        return
      }
      setGalleryBusy(true)
      let acc = [...normalizedGalleryUrls(gallery)]
      try {
        const batch = arr.slice(0, room)
        if (arr.length > room) {
          setGalleryHint(`${arr.length - room} file(s) skipped — gallery limit is ${maxGallery}.`)
        }
        for (const file of batch) {
          const invalid = validateGalleryImageFileForUpload(file)
          if (invalid) {
            setGalleryHint(invalid)
            break
          }
          const url = await uploadGalleryImage(file, slug)
          acc = [...acc, url]
          setGallery(acc)
        }
      } catch (e) {
        setGalleryHint(formatStorageUploadError(e))
      } finally {
        setGalleryBusy(false)
      }
    },
    [gallery, maxGallery, page, slug],
  )

  const onMusicFile = useCallback(
    async (file: File) => {
      if (!page || !slug || !caps?.music) return
      const invalid = validateAudioFileForUpload(file)
      if (invalid) {
        setSaveError(invalid)
        return
      }
      setMusicBusy(true)
      setSaveError(null)
      try {
        const url = await uploadMessageMusic(file, slug)
        setMusicUrl(url)
      } catch (e) {
        setSaveError(formatStorageUploadError(e))
      } finally {
        setMusicBusy(false)
      }
    },
    [caps?.music, page, slug],
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!page || !token || !slug) return
    setSaveError(null)
    setSaveState('saving')
    try {
      const clippedGallery = clipGalleryUrlsForTier(page.packageType, normalizedGalleryUrls(gallery))
      const nextTheme = effectiveThemePreset(page.packageType, themePreset)
      await pageRepository.customerSelfEditSave(slug, token, {
        recipientName: recipientName.trim(),
        senderName: senderName.trim(),
        shortMessage: shortMessage.trim(),
        longLetter: longLetter.trim(),
        gallery: clippedGallery,
        themePreset: nextTheme,
        musicUrl: caps?.music ? musicUrl.trim() : '',
        musicAutoplay: publicMusicAutoplayAllowed(page.packageType, musicAutoplay),
      })
      setGallery(clippedGallery)
      setThemePreset(nextTheme)
      setMusicUrl(caps?.music ? musicUrl.trim() : '')
      setSaveState('success')
      window.setTimeout(() => setSaveState('idle'), 4500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save changes.'
      setSaveError(msg)
      setSaveState('idle')
    }
  }

  if (!slug) return <Navigate to="/" replace />

  if (isLoading) {
    return (
      <div className="customer-self-edit-page customer-self-edit-page--center">
        <p className="customer-self-edit-loading">Opening your page…</p>
      </div>
    )
  }

  if (loadError || !page) {
    return (
      <div className="customer-self-edit-page customer-self-edit-page--center">
        <img src={himayaMark} alt="" className="customer-self-edit-mark" width={56} height={56} />
        <h1 className="customer-self-edit-title">Himaya</h1>
        <p className="customer-self-edit-error">{loadError ?? 'Something went wrong.'}</p>
        <Link to="/" className="customer-self-edit-back">
          Back to home
        </Link>
      </div>
    )
  }

  const showGallery = maxGallery > 0
  const showMusic = caps?.music
  const showThemeChoices = (caps?.themePresets.length ?? 0) > 1
  const showAutoplay = Boolean(caps?.music && caps.musicAutoplay)
  const recognizedMusic = parseDirectAudioUrl(musicUrl)

  return (
    <div className="customer-self-edit-page">
      <header className="customer-self-edit-header">
        <div className="customer-self-edit-brand">
          <img src={himayaMark} alt="" width={40} height={40} />
          <span>Himaya</span>
        </div>
        <Link to={`/m/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer" className="customer-self-edit-preview-link">
          View gift page
        </Link>
      </header>

      <main className="customer-self-edit-main">
        <div className="customer-self-edit-hero">
          <p className="customer-self-edit-eyebrow">Your bouquet story</p>
          <h1 className="customer-self-edit-h1">Personalize Your Himaya Page</h1>
          <p className="customer-self-edit-sub">
            Update the words and memories guests see when they open your gift. Only you have this link — keep it private.
          </p>
        </div>

        <form className="customer-self-edit-form" onSubmit={onSubmit}>
          <div className="customer-self-edit-card">
            <h2 className="customer-self-edit-card-title">Names &amp; message</h2>
            <label className="customer-self-edit-field">
              <span>Recipient name</span>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={200}
                required
                autoComplete="name"
              />
            </label>
            <label className="customer-self-edit-field">
              <span>Sender name</span>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                maxLength={200}
                required
                autoComplete="nickname"
              />
            </label>
            <label className="customer-self-edit-field">
              <span>Short message</span>
              <textarea
                value={shortMessage}
                onChange={(e) => setShortMessage(e.target.value)}
                rows={3}
                maxLength={12000}
              />
            </label>
            <label className="customer-self-edit-field">
              <span>Full letter</span>
              <textarea value={longLetter} onChange={(e) => setLongLetter(e.target.value)} rows={8} maxLength={60000} />
            </label>
          </div>

          {showThemeChoices ? (
            <div className="customer-self-edit-card">
              <h2 className="customer-self-edit-card-title">Look &amp; feel</h2>
              <p className="customer-self-edit-muted">Choose one of the styles included with your bouquet tier.</p>
              <div className="customer-self-edit-theme-chips">
                {caps!.themePresets.map((preset) => (
                  <label key={preset} className="customer-self-edit-chip">
                    <input
                      type="radio"
                      name="themePreset"
                      value={preset}
                      checked={themePreset === preset}
                      onChange={() => setThemePreset(preset)}
                    />
                    <span>{THEME_PRESET_LABEL[preset]}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {showMusic ? (
            <div className="customer-self-edit-card">
              <h2 className="customer-self-edit-card-title">Background music</h2>
              <label className="customer-self-edit-field">
                <span>Music URL (MP3 or similar)</span>
                <input
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  maxLength={2048}
                  placeholder="https://…"
                />
              </label>
              {recognizedMusic ? (
                <p className="customer-self-edit-muted">This link looks playable on the gift page.</p>
              ) : musicUrl.trim() ? (
                <p className="customer-self-edit-warn">We could not confirm this URL — guests may not hear audio.</p>
              ) : null}
              <label className="customer-self-edit-field customer-self-edit-file">
                <span>Or upload a file</span>
                <input
                  type="file"
                  accept={AUDIO_INPUT_ACCEPT}
                  disabled={musicBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) void onMusicFile(f)
                  }}
                />
              </label>
              {musicBusy ? <p className="customer-self-edit-muted">Uploading…</p> : null}
              {showAutoplay ? (
                <label className="customer-self-edit-check">
                  <input
                    type="checkbox"
                    checked={musicAutoplay}
                    onChange={(e) => setMusicAutoplay(e.target.checked)}
                  />
                  <span>Try to play automatically when the gift opens (when the browser allows it).</span>
                </label>
              ) : null}
            </div>
          ) : null}

          {showGallery ? (
            <div className="customer-self-edit-card">
              <h2 className="customer-self-edit-card-title">Memory gallery</h2>
              <p className="customer-self-edit-muted">
                Up to {maxGallery} images. Drag to reorder in your list — the first image appears first on the gift page.
              </p>
              {galleryList.length > 0 ? (
                <ul className="customer-self-edit-gallery">
                  {galleryList.map((url, index) => (
                    <li key={`${url}-${index}`} className="customer-self-edit-gallery-item">
                      <img src={url} alt="" decoding="async" loading="lazy" />
                      <button
                        type="button"
                        className="customer-self-edit-gallery-remove"
                        onClick={() => setGallery(galleryList.filter((_, i) => i !== index))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {remainingSlots > 0 ? (
                <label className="customer-self-edit-drop">
                  <input
                    type="file"
                    accept={GALLERY_INPUT_ACCEPT}
                    multiple
                    disabled={galleryBusy}
                    onChange={(e) => {
                      const fl = e.target.files
                      e.target.value = ''
                      if (fl?.length) void onGalleryFiles(fl)
                    }}
                  />
                  <span className="customer-self-edit-drop-inner">
                    <Heart size={22} aria-hidden />
                    {galleryBusy ? 'Uploading…' : `Add photos (${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left)`}
                  </span>
                </label>
              ) : (
                <p className="customer-self-edit-muted">Gallery is full for your tier.</p>
              )}
              {galleryHint ? <p className="customer-self-edit-warn">{galleryHint}</p> : null}
            </div>
          ) : null}

          <section className="customer-self-edit-card customer-self-edit-preview-slot" id="customer-edit-live-preview" aria-label="Live preview">
            <h2 className="customer-self-edit-card-title">Preview</h2>
            <p className="customer-self-edit-muted">
              Open <strong>View gift page</strong> in a new tab to see your changes after you save.
            </p>
          </section>

          {saveError ? (
            <p className="customer-self-edit-error-banner" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="customer-self-edit-actions">
            <button type="submit" className="customer-self-edit-save" disabled={saveState === 'saving'}>
              {saveState === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
            {saveState === 'success' ? (
              <span className="customer-self-edit-success" role="status">
                Saved. Your gift page is updated.
              </span>
            ) : null}
          </div>
        </form>
      </main>
    </div>
  )
}
