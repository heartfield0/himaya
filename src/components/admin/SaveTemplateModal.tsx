import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { buildTemplateFirestorePayload, type CustomerPageFormState } from '../../lib/pageTemplateMapping'
import { templateRepository } from '../../lib/templateRepository'
import type { SaveTemplateOptions } from '../../types/pageTemplate'

type Props = {
  open: boolean
  onClose: () => void
  form: CustomerPageFormState
}

const defaultOptions: SaveTemplateOptions = {
  includeTextContent: true,
  includeMusicUrl: true,
  includeThemeBackground: true,
}

export default function SaveTemplateModal({ open, onClose, form }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [opts, setOpts] = useState<SaveTemplateOptions>(defaultOptions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setOpts(defaultOptions)
    setError(null)
    setSaved(false)
    setSaving(false)
  }, [open])

  const handleBackdropKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a template name.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = buildTemplateFirestorePayload(form, trimmed, description, opts)
      await templateRepository.create(payload)
      setSaved(true)
      window.setTimeout(() => {
        onClose()
      }, 1600)
    } catch (e) {
      console.error('[Himaya] save template failed', e)
      setError(e instanceof Error ? e.message : 'Could not save template.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="himaya-modal-backdrop"
      role="presentation"
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={handleBackdropKey}
    >
      <div
        className="himaya-modal himaya-modal--save-template"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-template-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="himaya-modal-header">
          <h2 id="save-template-title">Save as template</h2>
          <p className="himaya-modal-lead">
            Save a reusable blueprint from this page. Customer names, slug, gallery, and video are never included.
          </p>
        </header>

        {saved ? (
          <div className="himaya-modal-success" role="status">
            <p className="himaya-modal-success-title">Template saved</p>
            <p className="muted">You can start new pages from it anytime.</p>
          </div>
        ) : (
          <>
            <div className="himaya-modal-body">
              <label className="himaya-modal-field">
                Template name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Graduation — warm letter"
                  autoComplete="off"
                  autoFocus
                />
              </label>
              <label className="himaya-modal-field">
                Description <span className="himaya-modal-optional">optional</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="When to use this layout…"
                  rows={3}
                />
              </label>

              <fieldset className="himaya-modal-checkset">
                <legend>Include in template</legend>
                <label className="himaya-modal-checkrow">
                  <input
                    type="checkbox"
                    checked={opts.includeTextContent}
                    onChange={(e) => setOpts((o) => ({ ...o, includeTextContent: e.target.checked }))}
                  />
                  <span>
                    <span className="himaya-modal-check-title">Text content</span>
                    <span className="himaya-modal-check-hint">Occasion, title, subtitle, short message, and letter</span>
                  </span>
                </label>
                <label className="himaya-modal-checkrow">
                  <input
                    type="checkbox"
                    checked={opts.includeMusicUrl}
                    onChange={(e) => setOpts((o) => ({ ...o, includeMusicUrl: e.target.checked }))}
                  />
                  <span>
                    <span className="himaya-modal-check-title">Music URL</span>
                    <span className="himaya-modal-check-hint">Background track link from this page</span>
                  </span>
                </label>
                <label className="himaya-modal-checkrow">
                  <input
                    type="checkbox"
                    checked={opts.includeThemeBackground}
                    onChange={(e) => setOpts((o) => ({ ...o, includeThemeBackground: e.target.checked }))}
                  />
                  <span>
                    <span className="himaya-modal-check-title">Theme background</span>
                    <span className="himaya-modal-check-hint">Full-page backdrop image URL (Premium)</span>
                  </span>
                </label>
              </fieldset>

              <p className="field-hint himaya-modal-footnote">
                Package tier, theme preset, unlock settings, and page toggles are always saved with the template.
              </p>

              {error ? <p className="error-msg himaya-modal-error">{error}</p> : null}
            </div>

            <footer className="himaya-modal-footer">
              <button type="button" className="ghost-btn" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={() => void submit()} disabled={saving}>
                {saving ? 'Saving…' : 'Save template'}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
