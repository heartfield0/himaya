import type { CustomerPageFormState } from './pageTemplateMapping'

export const DEFAULT_CARD_SCAN_LINE = 'Scan to open your surprise'

export function resolvePrintCardHeadline(form: CustomerPageFormState): string {
  if (form.cardHeadline.trim()) return form.cardHeadline.trim()
  if (form.title.trim()) return form.title.trim()
  if (form.occasion.trim()) return form.occasion.trim()
  return 'Your gift awaits'
}

export function resolvePrintCardSubtext(form: CustomerPageFormState): string {
  if (form.cardSubtext.trim()) return form.cardSubtext.trim()
  if (form.subtitle.trim()) return form.subtitle.trim()
  return DEFAULT_CARD_SCAN_LINE
}

export function resolvePrintCardRecipient(form: CustomerPageFormState): string {
  if (form.cardRecipientName.trim()) return form.cardRecipientName.trim()
  return form.recipientName.trim() || 'Someone special'
}

/** Placeholder hints for empty override fields (ignores card* overrides). */
export function defaultPrintCardHeadlinePlaceholder(form: CustomerPageFormState): string {
  if (form.title.trim()) return form.title.trim()
  if (form.occasion.trim()) return form.occasion.trim()
  return 'Your gift awaits'
}

export function defaultPrintCardSubtextPlaceholder(form: CustomerPageFormState): string {
  if (form.subtitle.trim()) return form.subtitle.trim()
  return DEFAULT_CARD_SCAN_LINE
}
