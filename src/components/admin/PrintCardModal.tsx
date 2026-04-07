import { toPng } from 'html-to-image'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import QRCode from 'qrcode'
import type { CustomerPageFormState } from '../../lib/pageTemplateMapping'
import {
  defaultPrintCardHeadlinePlaceholder,
  defaultPrintCardSubtextPlaceholder,
  resolvePrintCardRecipient,
  resolvePrintCardSubtext,
} from '../../lib/printCardResolve'
import { DEFAULT_PRINT_CARD_FORMAT, PRINT_CARD_TEMPLATE_OPTIONS } from '../../types/printCard'
import type { PrintCardTemplateId } from '../../types/customerPage'
import { PrintCardFace } from './printCard/PrintCardFace'

type Props = {
  open: boolean
  onClose: () => void
  publicUrl: string
  slugForFile: string
  form: CustomerPageFormState
  onFormPatch: (patch: Partial<CustomerPageFormState>) => void
}

export default function PrintCardModal({
  open,
  onClose,
  publicUrl,
  slugForFile,
  form,
  onFormPatch,
}: Props) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setQrDataUrl(null)
    void QRCode.toDataURL(publicUrl, {
      width: 840,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#1f1610ff', light: '#ffffffff' },
    }).then((url: string) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [open, publicUrl])

  const handleBackdropKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  const downloadPng = useCallback(async () => {
    const node = exportRef.current
    if (!node || !qrDataUrl) return
    setExporting(true)
    setExportError(null)
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
        quality: 1,
      })
      const safe =
        slugForFile.trim().replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 72) || 'himaya-card'
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${safe}-himaya-card.png`
      a.click()
    } catch (e) {
      console.error('[Himaya] print card PNG export failed', e)
      setExportError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }, [qrDataUrl, slugForFile])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopyDone(true)
      window.setTimeout(() => setCopyDone(false), 2000)
    } catch {
      setCopyDone(false)
    }
  }, [publicUrl])

  if (!open) return null

  const templateId: PrintCardTemplateId = form.selectedCardTemplate
  const subtext = resolvePrintCardSubtext(form)
  const recipient = resolvePrintCardRecipient(form)

  return (
    <div
      className="himaya-modal-backdrop print-card-modal-backdrop"
      role="presentation"
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={handleBackdropKey}
    >
      <div
        className="himaya-modal himaya-modal--print-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-card-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="himaya-modal-header print-card-modal-header">
          <h2 id="print-card-title">Generate print card</h2>
          <p className="himaya-modal-lead">
            Compact 4×3&quot; bouquet tag — centered scan message, large QR, then recipient and a short note. Top-left safe
            zone for ribbon punch. Subtext and recipient are editable; main scan line is fixed for readability.
          </p>
          <button type="button" className="print-card-modal-close ghost-btn" onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>

        <div className="print-card-modal-body">
          <div className="print-card-modal-controls">
            <label className="himaya-modal-field">
              Card template
              <select
                value={templateId}
                onChange={(e) =>
                  onFormPatch({ selectedCardTemplate: e.target.value as PrintCardTemplateId })
                }
              >
                {PRINT_CARD_TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — {opt.hint}
                  </option>
                ))}
              </select>
            </label>

            <label className="himaya-modal-field">
              Card headline
              <input
                value={form.cardHeadline}
                onChange={(e) => onFormPatch({ cardHeadline: e.target.value })}
                placeholder={defaultPrintCardHeadlinePlaceholder(form)}
                autoComplete="off"
              />
            </label>
            <p className="field-hint print-card-field-hint">
              Saved on the page; not shown on this tag (scan line is fixed for small-print clarity).
            </p>

            <label className="himaya-modal-field">
              Card subtext
              <textarea
                value={form.cardSubtext}
                onChange={(e) => onFormPatch({ cardSubtext: e.target.value })}
                placeholder={defaultPrintCardSubtextPlaceholder(form)}
                rows={2}
              />
            </label>

            <label className="himaya-modal-field">
              Recipient on card <span className="himaya-modal-optional">optional</span>
              <input
                value={form.cardRecipientName}
                onChange={(e) => onFormPatch({ cardRecipientName: e.target.value })}
                placeholder={form.recipientName || 'Name as it should appear'}
                autoComplete="off"
              />
            </label>

            <div className="print-card-modal-actions">
              <button
                type="button"
                className="primary-btn"
                disabled={!qrDataUrl || exporting}
                onClick={() => void downloadPng()}
              >
                {exporting ? 'Preparing PNG…' : 'Download PNG'}
              </button>
              <button type="button" className="secondary-btn" onClick={() => void copyLink()}>
                {copyDone ? 'Copied!' : 'Copy public link'}
              </button>
            </div>

            {exportError ? <p className="error-msg">{exportError}</p> : null}

            <div className="print-card-dim-guidance">
              <p className="print-card-dim-guidance-title">Print settings</p>
              <p className="muted">
                Export: {DEFAULT_PRINT_CARD_FORMAT.widthPx} × {DEFAULT_PRINT_CARD_FORMAT.heightPx}px (
                {DEFAULT_PRINT_CARD_FORMAT.label} · {DEFAULT_PRINT_CARD_FORMAT.widthInch}&quot; ×{' '}
                {DEFAULT_PRINT_CARD_FORMAT.heightInch}&quot; · {DEFAULT_PRINT_CARD_FORMAT.widthMm} ×{' '}
                {DEFAULT_PRINT_CARD_FORMAT.heightMm} mm at 300 DPI). Print at 100% scale; disable shrink-to-fit. Style
                presets only tweak background warmth.
              </p>
            </div>
          </div>

          <div className="print-card-modal-preview">
            <p className="print-card-preview-label muted">Live preview</p>
            <div className="print-card-preview-scaler">
              <div className="print-card-preview-scale-wrap">
                <div ref={exportRef} className="print-card-export-anchor">
                  <PrintCardFace
                    templateId={templateId}
                    qrDataUrl={qrDataUrl}
                    subtext={subtext}
                    recipientLine={recipient}
                  />
                </div>
              </div>
            </div>
            <p className="field-hint print-card-url-hint" title={publicUrl}>
              QR links to: {publicUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
