import type { CustomerPage } from '../types/customerPage'

const SLUG_SUFFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Random alphanumeric suffix, length in [minLen, maxLen] inclusive. */
export function randomSlugSuffix(minLen = 4, maxLen = 6): string {
  const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1))
  let s = ''
  for (let i = 0; i < len; i++) {
    s += SLUG_SUFFIX_CHARS[Math.floor(Math.random() * SLUG_SUFFIX_CHARS.length)]
  }
  return s
}

/** One candidate slug: `{base}-{suffix}`. Trims trailing hyphens from base; falls back to `page`. */
export function buildDuplicateSlugCandidate(baseSlug: string): string {
  const trimmed = baseSlug.trim().replace(/-+$/, '')
  const base = trimmed || 'page'
  return `${base}-${randomSlugSuffix()}`
}

/**
 * Firestore payload for a new page cloned from `source` with a fresh `slug`.
 * Resets identity, metrics, and status; copies content, media, theme, and toggles.
 */
export function pageToDuplicateCreatePayload(
  source: CustomerPage,
  newSlug: string,
): Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'> {
  return {
    slug: newSlug,
    recipientName: source.recipientName,
    senderName: source.senderName,
    occasion: source.occasion,
    occasionIcon: source.occasionIcon,
    packageType: source.packageType,
    title: source.title,
    subtitle: source.subtitle,
    shortMessage: source.shortMessage,
    longLetter: source.longLetter,
    videoUrl: source.videoUrl,
    gallery: [...source.gallery],
    musicUrl: source.musicUrl,
    status: 'draft',
    unlockAt: source.unlockAt,
    themePreset: source.themePreset,
    passwordEnabled: source.passwordEnabled,
    giftAccessPassword: source.giftAccessPassword,
    timedUnlockEnabled: source.timedUnlockEnabled,
    notifyOnOpen: source.notifyOnOpen,
    musicAutoplay: source.musicAutoplay,
    themeAccentColor: source.themeAccentColor,
    themeBackgroundImageUrl: source.themeBackgroundImageUrl,
    selectedCardTemplate: source.selectedCardTemplate,
    cardHeadline: source.cardHeadline,
    cardSubtext: source.cardSubtext,
    cardRecipientName: source.cardRecipientName,
    allowCustomerEdit: false,
    customerEditToken: null,
    customerEditExpiresAt: null,
  }
}
