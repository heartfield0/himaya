import { useEffect, useState } from 'react'

const SLIDE_MS = 2600

type Props = {
  images: string[]
  /** Opens the existing fullscreen gallery (e.g. lightbox at index 0). */
  onOpen: () => void
}

export function MemoryGalleryPreview({ images, onOpen }: Props) {
  const [active, setActive] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const multi = images.length > 1
  const slideshow = multi && !reduceMotion

  useEffect(() => {
    if (!slideshow) return
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length)
    }, SLIDE_MS)
    return () => clearInterval(id)
  }, [slideshow, images.length])

  useEffect(() => {
    if (images.length < 2) return
    const next = (active + 1) % images.length
    const img = new Image()
    img.src = images[next]
  }, [active, images])

  if (images.length === 0) return null

  return (
    <button
      type="button"
      className={`memory-gallery-preview${multi ? '' : ' memory-gallery-preview--solo'}`}
      onClick={onOpen}
      aria-label="Open memory gallery fullscreen"
    >
      <div className="memory-gallery-preview-viewport">
        {multi ? (
          images.map((src, i) => (
            <div
              key={`${i}-${src}`}
              className={`memory-gallery-preview-slide${i === active ? ' memory-gallery-preview-slide--active' : ''}${slideshow ? '' : ' memory-gallery-preview-slide--static'}`}
              aria-hidden={i !== active}
            >
              <img
                key={i === active ? `live-${active}` : `hold-${i}`}
                src={src}
                alt=""
                decoding="async"
                loading={i === 0 ? 'eager' : 'lazy'}
                className="memory-gallery-preview-img"
                draggable={false}
              />
            </div>
          ))
        ) : (
          <div className="memory-gallery-preview-slide memory-gallery-preview-slide--active memory-gallery-preview-slide--static">
            <img
              src={images[0]}
              alt=""
              decoding="async"
              loading="eager"
              className="memory-gallery-preview-img"
              draggable={false}
            />
          </div>
        )}
      </div>
      <span className="memory-gallery-preview-overlay">
        <span className="memory-gallery-preview-overlay-text">Tap to view memories 💌</span>
      </span>
    </button>
  )
}

