import { Timestamp } from 'firebase/firestore'
import type { CustomerPage } from '../types/customerPage'
import { parseOccasionSealIcon } from './occasionSealIcon'
import { parsePrintCardTemplateId } from '../types/printCard'

/** Public read model: doc id = page slug. No `customerEditToken`. */
export const PUBLIC_CUSTOMER_PAGES = 'publicCustomerPages'

/** Fields a customer may change (Firestore + app). */
export const CUSTOMER_SELF_EDIT_FIELD_NAMES = [
  'recipientName',
  'senderName',
  'shortMessage',
  'longLetter',
  'gallery',
  'themePreset',
  'musicUrl',
  'musicAutoplay',
] as const

export type CustomerSelfEditFieldName = (typeof CUSTOMER_SELF_EDIT_FIELD_NAMES)[number]

export type CustomerSelfEditPayload = Pick<
  CustomerPage,
  | 'recipientName'
  | 'senderName'
  | 'shortMessage'
  | 'longLetter'
  | 'gallery'
  | 'themePreset'
  | 'musicUrl'
  | 'musicAutoplay'
>

function expiresAtToTimestamp(iso: string | null): Timestamp | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Timestamp.fromDate(d)
}

function expiresAtFromRaw(raw: unknown): string | null {
  if (raw == null) return null
  if (raw instanceof Timestamp) return raw.toDate().toISOString()
  if (typeof raw === 'string') return raw
  return null
}

/**
 * Strip secrets and write everything the gift page + mirror need.
 * `customerEditToken` lives only on `customerPages`.
 */
export function toPublicMirrorPayload(page: CustomerPage): Record<string, unknown> {
  return {
    pageId: page.id,
    slug: page.slug,
    status: page.status,
    createdAt: page.createdAt,
    recipientName: page.recipientName,
    senderName: page.senderName,
    occasion: page.occasion,
    occasionIcon: page.occasionIcon,
    packageType: page.packageType,
    title: page.title,
    subtitle: page.subtitle,
    shortMessage: page.shortMessage,
    longLetter: page.longLetter,
    videoUrl: page.videoUrl,
    gallery: page.gallery,
    musicUrl: page.musicUrl,
    themePreset: page.themePreset,
    musicAutoplay: page.musicAutoplay,
    themeAccentColor: page.themeAccentColor,
    themeBackgroundImageUrl: page.themeBackgroundImageUrl,
    passwordEnabled: page.passwordEnabled,
    giftAccessPassword: page.giftAccessPassword,
    timedUnlockEnabled: page.timedUnlockEnabled,
    unlockAt: page.unlockAt,
    notifyOnOpen: page.notifyOnOpen,
    allowCustomerEdit: page.allowCustomerEdit,
    customerEditExpiresAt: expiresAtToTimestamp(page.customerEditExpiresAt),
    selectedCardTemplate: page.selectedCardTemplate,
    cardHeadline: page.cardHeadline,
    cardSubtext: page.cardSubtext,
    cardRecipientName: page.cardRecipientName,
    updatedAt: Timestamp.fromDate(new Date(page.updatedAt || Date.now())),
  }
}

/** Map mirror Firestore doc → `CustomerPage` shape for existing public UI. */
export function mirrorDocToCustomerPage(slug: string, raw: Record<string, unknown>): CustomerPage {
  const pageId = String(raw.pageId ?? '')
  return {
    id: pageId,
    slug: String(raw.slug ?? slug),
    recipientName: String(raw.recipientName ?? ''),
    senderName: String(raw.senderName ?? ''),
    occasion: String(raw.occasion ?? ''),
    occasionIcon: parseOccasionSealIcon(raw.occasionIcon),
    packageType: (raw.packageType as CustomerPage['packageType']) ?? 'basic',
    title: String(raw.title ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    shortMessage: String(raw.shortMessage ?? ''),
    longLetter: String(raw.longLetter ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    gallery: Array.isArray(raw.gallery) ? (raw.gallery as string[]) : [],
    musicUrl: String(raw.musicUrl ?? ''),
    status: (raw.status as CustomerPage['status']) ?? 'draft',
    unlockAt: raw.unlockAt ? String(raw.unlockAt) : null,
    views: 0,
    lastViewedAt: null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt:
      raw.updatedAt instanceof Timestamp
        ? raw.updatedAt.toDate().toISOString()
        : typeof raw.updatedAt === 'string'
          ? raw.updatedAt
          : new Date().toISOString(),
    themePreset: (raw.themePreset as CustomerPage['themePreset']) ?? 'classic',
    passwordEnabled: Boolean(raw.passwordEnabled),
    giftAccessPassword: typeof raw.giftAccessPassword === 'string' ? raw.giftAccessPassword : '',
    timedUnlockEnabled: Boolean(raw.timedUnlockEnabled),
    notifyOnOpen: raw.notifyOnOpen === undefined ? true : Boolean(raw.notifyOnOpen),
    musicAutoplay: Boolean(raw.musicAutoplay),
    themeAccentColor: typeof raw.themeAccentColor === 'string' ? raw.themeAccentColor : '',
    themeBackgroundImageUrl: typeof raw.themeBackgroundImageUrl === 'string' ? raw.themeBackgroundImageUrl : '',
    selectedCardTemplate: parsePrintCardTemplateId(raw.selectedCardTemplate),
    cardHeadline: typeof raw.cardHeadline === 'string' ? raw.cardHeadline : '',
    cardSubtext: typeof raw.cardSubtext === 'string' ? raw.cardSubtext : '',
    cardRecipientName: typeof raw.cardRecipientName === 'string' ? raw.cardRecipientName : '',
    allowCustomerEdit: Boolean(raw.allowCustomerEdit),
    customerEditToken: null,
    customerEditExpiresAt: expiresAtFromRaw(raw.customerEditExpiresAt),
  }
}
