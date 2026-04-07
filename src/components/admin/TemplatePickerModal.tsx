import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { OccasionSealIcon } from '../../lib/occasionSealIcon'
import { PACKAGE_TIER_LABEL, THEME_PRESET_LABEL } from '../../lib/adminContentLabels'
import { templateRepository } from '../../lib/templateRepository'
import type { PageTemplate } from '../../types/pageTemplate'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (template: PageTemplate) => void
}

export default function TemplatePickerModal({ open, onClose, onSelect }: Props) {
  const [list, setList] = useState<PageTemplate[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setList(null)
    setLoadError(null)
    void templateRepository
      .list()
      .then((rows) => {
        if (!cancelled) setList(rows)
      })
      .catch((e) => {
        console.error('[Himaya] list templates failed', e)
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load templates.')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleBackdropKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  if (!open) return null

  return (
    <div
      className="himaya-modal-backdrop himaya-modal-backdrop--wide"
      role="presentation"
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={handleBackdropKey}
    >
      <div
        className="himaya-modal himaya-modal--template-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="himaya-modal-header">
          <h2 id="template-picker-title">Choose a template</h2>
          <p className="himaya-modal-lead">
            Start from a curated blueprint. You will still add a unique slug and customer details before saving.
          </p>
        </header>

        <div className="himaya-modal-body himaya-modal-body--scroll">
          {loadError ? <p className="error-msg">{loadError}</p> : null}
          {!loadError && list === null ? (
            <p className="muted himaya-modal-loading">Loading templates…</p>
          ) : null}
          {!loadError && list && list.length === 0 ? (
            <p className="muted himaya-modal-empty">No templates yet. Save one from an existing page in the editor.</p>
          ) : null}
          {list && list.length > 0 ? (
            <ul className="template-picker-grid">
              {list.map((t) => (
                <li key={t.id}>
                  <article className="template-premium-card">
                    <div className="template-premium-card-top">
                      <div className="template-premium-card-seal" aria-hidden>
                        <OccasionSealIcon id={t.occasionIcon} />
                      </div>
                      <div className="template-premium-card-head">
                        <h3 className="template-premium-card-name">{t.name}</h3>
                        {t.description.trim() ? (
                          <p className="template-premium-card-desc">{t.description}</p>
                        ) : (
                          <p className="template-premium-card-desc muted">No description</p>
                        )}
                      </div>
                    </div>
                    <div className="template-premium-card-meta">
                      <span className="template-chip template-chip--tier">{PACKAGE_TIER_LABEL[t.packageTier]}</span>
                      <span className="template-chip">{THEME_PRESET_LABEL[t.theme]}</span>
                    </div>
                    <button
                      type="button"
                      className="template-premium-card-cta"
                      onClick={() => onSelect(t)}
                    >
                      Use this template
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <footer className="himaya-modal-footer himaya-modal-footer--single">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
