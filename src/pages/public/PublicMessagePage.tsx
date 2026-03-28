import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Flower2, Heart, Lock, Music2, Sparkles } from 'lucide-react'
import himayaMark from '../../assets/logo/himaya-mark.png'
import { pageRepository } from '../../lib/pageRepository'
import {
  clipGalleryUrlsForTier,
  getPackageCapabilities,
  publicMusicAutoplayAllowed,
} from '../../lib/packageCapabilities'
import { normalizedGalleryUrls, parseDirectAudioUrl, parseVideoUrl } from '../../lib/mediaUrls'
import { resolvePublicThemeClass } from '../../lib/publicTheme'
import { OccasionSealIcon, resolvePublicEnvelopeSealIcon } from '../../lib/occasionSealIcon'
import { accentCssVariables, resolvePublicPremiumAccentHex, resolvePublicPremiumBackgroundUrl } from '../../lib/themeAccent'
import type { CustomerPage } from '../../types/customerPage'

/** Envelope 3D open + letter lift (ms) — total perceived “opening” ~1.3s. */
const INTRO_MOTION_MS = 1300
/** Overlay fade after motion completes (ms). */
const INTRO_FADE_MS = 380

export default function PublicMessagePage() {
  const { slug } = useParams()
  const [viewedAtMs] = useState(() => Date.now())
  const [page, setPage] = useState<CustomerPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [hasOpenedIntro, setHasOpenedIntro] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const introTimersRef = useRef<number[]>([])

  useEffect(() => {
    introTimersRef.current.forEach((id) => window.clearTimeout(id))
    introTimersRef.current = []
    setHasOpenedIntro(false)
    setIsOpening(false)
  }, [slug])

  useEffect(() => {
    return () => {
      introTimersRef.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadPage = async () => {
      if (!slug) return
      setHasError(false)
      setIsLoading(true)

      try {
        const current = await pageRepository.getPublicBySlug(slug)
        if (!isMounted) return

        if (!current) {
          setPage(null)
          return
        }

        setPage(current)

        void pageRepository.incrementView(slug).then((viewed) => {
          if (!isMounted || !viewed) return
          setPage(viewed)
        })
      } catch (error) {
        console.error('[Himaya] Failed to load public page:', error)
        if (!isMounted) return
        setHasError(true)
        setPage(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadPage()

    return () => {
      isMounted = false
    }
  }, [slug])

  const tierCaps = page ? getPackageCapabilities(page.packageType) : null
  const giftIntroEnabled = tierCaps?.giftIntroEnvelope ?? false
  const contentUnlocked = !giftIntroEnabled || hasOpenedIntro

  const unlockPending =
    !!page &&
    !!tierCaps?.publicTimedUnlock &&
    !!page.unlockAt &&
    new Date(page.unlockAt).getTime() > viewedAtMs

  const content = useMemo(() => {
    if (!page) {
      return {
        showMessage: false,
        showLetter: false,
        video: null as ReturnType<typeof parseVideoUrl>,
        gallery: [] as string[],
        audioSrc: null as string | null,
        showKeepsakePlaceholder: false,
      }
    }

    const caps = getPackageCapabilities(page.packageType)
    const showMessage = page.shortMessage.trim().length > 0
    const showLetter = page.longLetter.trim().length > 0
    const video = caps.video ? parseVideoUrl(page.videoUrl) : null
    const gallery =
      caps.maxGalleryImages > 0
        ? clipGalleryUrlsForTier(page.packageType, normalizedGalleryUrls(page.gallery))
        : []
    const audioSrc = caps.music ? parseDirectAudioUrl(page.musicUrl) : null

    const hasAnyBody = showMessage || showLetter || video !== null || gallery.length > 0
    const showKeepsakePlaceholder = !hasAnyBody

    return { showMessage, showLetter, video, gallery, audioSrc, showKeepsakePlaceholder }
  }, [page])

  const audioSrc = content.audioSrc
  const wantMusicAutoplay = page ? publicMusicAutoplayAllowed(page.packageType, page.musicAutoplay === true) : false

  useEffect(() => {
    if (!contentUnlocked || !audioSrc || !wantMusicAutoplay || unlockPending) return

    const el = audioRef.current
    if (!el) return

    let cancelled = false
    let playbackStarted = false

    const tryPlay = () => {
      if (cancelled || playbackStarted) return
      void el.play().then(() => {
        playbackStarted = true
      }).catch(() => {
        /* NotAllowedError: autoplay blocked; controls stay visible. */
      })
    }

    tryPlay()

    const onMeta = () => {
      tryPlay()
    }
    el.addEventListener('loadedmetadata', onMeta, { once: true })

    const retryId = window.setTimeout(() => {
      tryPlay()
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(retryId)
      el.removeEventListener('loadedmetadata', onMeta)
    }
  }, [contentUnlocked, slug, audioSrc, wantMusicAutoplay, unlockPending])

  const handleOpenLetter = () => {
    if (isOpening || hasOpenedIntro) return
    setIsOpening(true)
    const t1 = window.setTimeout(() => {
      setHasOpenedIntro(true)
    }, INTRO_MOTION_MS)
    const t2 = window.setTimeout(() => {
      setIsOpening(false)
    }, INTRO_MOTION_MS + INTRO_FADE_MS)
    introTimersRef.current.push(t1, t2)
  }

  if (!slug) return <Navigate to="/login" replace />

  if (isLoading) {
    return (
      <div className="public-page theme-classic">
        <p>Loading your gift...</p>
      </div>
    )
  }
  if (hasError) {
    return (
      <div className="public-page theme-classic">
        <p>Something went wrong while opening this gift page. Please try again.</p>
      </div>
    )
  }
  if (!page) {
    return (
      <div className="public-page theme-classic">
        <p>Page not found.</p>
      </div>
    )
  }

  const themeClass = resolvePublicThemeClass(page.packageType, page.themePreset)
  const premiumAccentHex = resolvePublicPremiumAccentHex(page)
  const premiumBgUrl = resolvePublicPremiumBackgroundUrl(page)
  const articleAccentStyle = premiumAccentHex ? accentCssVariables(premiumAccentHex) : undefined
  const introOverlayDone = !giftIntroEnabled || (hasOpenedIntro && !isOpening)
  const envelopeSealIcon = resolvePublicEnvelopeSealIcon(page.packageType, page.occasionIcon)

  return (
    <article
      className={`public-page ${themeClass}${contentUnlocked ? ' public-page--revealed' : ''}${premiumAccentHex ? ' public-page--custom-accent' : ''}${premiumBgUrl ? ' public-page--custom-bg' : ''}`}
      style={articleAccentStyle}
    >
      {premiumBgUrl ? (
        <>
          <div
            className="public-page-custom-bg"
            style={{ backgroundImage: `url(${JSON.stringify(premiumBgUrl)})` }}
            aria-hidden
          />
          <div className="public-page-custom-bg-scrim" aria-hidden />
        </>
      ) : null}
      {giftIntroEnabled ? (
        <div
          className={`public-intro-overlay${isOpening ? ' public-intro-overlay--opening' : ''}${introOverlayDone ? ' public-intro-overlay--done' : ''}`}
          aria-hidden={hasOpenedIntro}
          {...(hasOpenedIntro ? { inert: true } : {})}
        >
          <div className="public-intro-overlay-bg" aria-hidden="true" />
          <div className="public-intro-inner">
            <img
              src={himayaMark}
              alt=""
              className="public-intro-mark"
              decoding="async"
            />
            <p className="public-intro-brand">Himaya</p>
            <p className="public-intro-subtitle">A message prepared just for you</p>

            <div className={`public-intro-envelope${isOpening ? ' public-intro-envelope--opening' : ''}`}>
              <div className="public-intro-envelope-shadow" aria-hidden="true" />
              <div className="public-intro-envelope-body">
                <div className="public-intro-envelope-back">
                  <span className="public-intro-envelope-texture" aria-hidden="true" />
                </div>
                <div className="public-intro-envelope-pocket" aria-hidden="true" />
                <div className="public-intro-letter" aria-hidden="true">
                  <span className="public-intro-letter-line" />
                  <span className="public-intro-letter-line" />
                  <span className="public-intro-letter-line short" />
                </div>
                <div className="public-intro-flap-3d" aria-hidden="true">
                  <div className="public-intro-flap">
                    <span className="public-intro-flap-shade" aria-hidden="true" />
                  </div>
                </div>
              </div>
              {/** Outside preserve-3d body so the flap’s 3D depth cannot paint over the seal */}
              <div className="public-intro-seal" aria-hidden="true">
                <span className="public-intro-seal-ring" aria-hidden="true" />
                <span className="public-intro-seal-wax" />
                <span className="public-intro-seal-icon">
                  <OccasionSealIcon id={envelopeSealIcon} />
                </span>
              </div>
            </div>

            <button
              type="button"
              className="public-intro-open-btn"
              onClick={handleOpenLetter}
              disabled={isOpening}
              aria-busy={isOpening}
            >
              {isOpening ? 'Opening…' : 'Open Letter'}
            </button>
          </div>
        </div>
      ) : null}

      <div
        className="public-main-reveal"
        aria-hidden={!contentUnlocked}
        {...(!contentUnlocked ? { inert: true } : {})}
      >
        <div className="public-top-glow" aria-hidden="true" />
        <header className="public-hero">
          <div className="brand-pill">
            <img
              src={himayaMark}
              alt=""
              className="brand-pill-mark"
              decoding="async"
            />
            Himaya Gift Message
          </div>
          <p className="occasion">{page.occasion}</p>
          <h1>{page.recipientName}</h1>
          <h2>{page.title}</h2>
          {page.subtitle.trim() ? <p className="subtitle">{page.subtitle}</p> : null}
          <p className="gift-note">A handmade moment prepared with care.</p>
        </header>

        {unlockPending ? (
          <section className="public-card unlock-card">
            <p className="unlock-tag"><Lock size={14} /> Timed Gift</p>
            <h3>Your surprise is waiting to bloom</h3>
            <p>
              This page has been lovingly prepared and will open on{' '}
              <strong>{new Date(page.unlockAt ?? '').toLocaleString()}</strong>.
            </p>
            <p className="unlock-soft">Please return at the scheduled time to experience your full message.</p>
          </section>
        ) : (
          <div className="public-content-stack">
            {content.showMessage ? (
              <section className="public-card message-card">
                <p className="section-kicker"><Heart size={14} /> Personal Message</p>
                <p>{page.shortMessage}</p>
                <p className="message-sign">With love, {page.senderName}</p>
              </section>
            ) : null}

            {content.showLetter ? (
              <section className="public-card letter-card">
                <p className="section-kicker"><Sparkles size={14} /> Letter</p>
                <p className="letter">{page.longLetter}</p>
              </section>
            ) : null}

            {content.video ? (
              <section className="public-card">
                <p className="section-kicker">Video Message</p>
                {content.video.kind === 'youtube' ? (
                  <div className="video-frame">
                    <iframe
                      src={content.video.embedSrc}
                      title="Gift video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="video-frame video-frame-native">
                    <video src={content.video.src} controls playsInline preload="metadata" />
                  </div>
                )}
              </section>
            ) : null}

            {content.gallery.length > 0 ? (
              <section className="public-card">
                <p className="section-kicker">Memory Gallery</p>
                <div className="gallery-grid">
                  {content.gallery.map((image) => (
                    <img key={image} src={image} alt="Gift memory" loading="lazy" />
                  ))}
                </div>
              </section>
            ) : null}

            {content.showKeepsakePlaceholder ? (
              <section className="public-card media-placeholder-card">
                <p className="section-kicker">A Gentle Moment</p>
                <p>
                  This page was intentionally created as a pure keepsake—take a breath and enjoy the moment above.
                </p>
              </section>
            ) : null}
          </div>
        )}

        {contentUnlocked && !unlockPending && tierCaps?.music && content.audioSrc ? (
          <div className="public-music-dock" aria-label="Background music">
            <p className="public-music-label">
              <Music2 size={14} aria-hidden="true" /> Ambient music
            </p>
            <audio
              ref={audioRef}
              className="public-audio"
              src={content.audioSrc}
              controls
              playsInline
              loop
              preload="auto"
            />
          </div>
        ) : null}

        <footer className="public-footer">
          <div className="public-footer-mark">
            <Flower2 size={16} aria-hidden="true" />
            <span>Himaya</span>
          </div>
          <p>Crafted by hand, shared with heart.</p>
          <small>Premium handmade gifting experiences</small>
        </footer>
      </div>
    </article>
  )
}
