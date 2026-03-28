import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export function GalleryLightbox({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext])

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx > 56) goPrev()
    else if (dx < -56) goNext()
  }

  const n = index + 1
  const total = images.length
  const src = images[index]

  const node = (
    <div className="memory-lightbox-root" role="dialog" aria-modal="true" aria-label="Gallery fullscreen">
      <button
        type="button"
        className="memory-lightbox-backdrop"
        aria-label="Close gallery"
        onClick={onClose}
      />
      <p className="memory-lightbox-counter" aria-live="polite">
        {n} / {total}
      </p>
      <button type="button" className="memory-lightbox-close" onClick={onClose} aria-label="Close">
        <X size={22} strokeWidth={2} />
      </button>
      {total > 1 ? (
        <>
          <button
            type="button"
            className="memory-lightbox-nav memory-lightbox-nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="memory-lightbox-nav memory-lightbox-nav--next"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            aria-label="Next image"
          >
            <ChevronRight size={28} strokeWidth={2} />
          </button>
        </>
      ) : null}
      <div
        className="memory-lightbox-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="memory-lightbox-stage-inner">
          <img
            key={src}
            src={src}
            alt=""
            className="memory-lightbox-photo"
            decoding="async"
            loading="eager"
          />
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
