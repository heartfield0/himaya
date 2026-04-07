import type { PrintCardTemplateId } from './customerPage'

/**
 * Compact bouquet gift tag — 4×3 in landscape @300 DPI (1200×900).
 */
export const PRINT_CARD_FORMATS = {
  inch4x3Landscape: {
    id: '4x3-landscape' as const,
    label: '4 × 3 in landscape',
    widthInch: 4,
    heightInch: 3,
    widthMm: 101.6,
    heightMm: 76.2,
    widthPx: 1200,
    heightPx: 900,
  },
} as const

export const DEFAULT_PRINT_CARD_FORMAT = PRINT_CARD_FORMATS.inch4x3Landscape

export const PRINT_CARD_TEMPLATE_OPTIONS: {
  id: PrintCardTemplateId
  label: string
  hint: string
}[] = [
  {
    id: 'classic-romantic',
    label: 'Garden Florals',
    hint: 'Warm cream wash (subtle; layout stays centered)',
  },
  {
    id: 'graduation',
    label: 'Laurel & Gold',
    hint: 'Parchment warmth (subtle)',
  },
  {
    id: 'minimal-premium',
    label: 'Butterfly Whisper',
    hint: 'Brightest cream (subtle)',
  },
]

const VALID_IDS = new Set<PrintCardTemplateId>(PRINT_CARD_TEMPLATE_OPTIONS.map((o) => o.id))

export function parsePrintCardTemplateId(raw: unknown): PrintCardTemplateId {
  if (typeof raw === 'string' && VALID_IDS.has(raw as PrintCardTemplateId)) {
    return raw as PrintCardTemplateId
  }
  return 'classic-romantic'
}
