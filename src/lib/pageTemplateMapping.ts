import { effectiveThemePreset } from './packageCapabilities'
import { parseOccasionSealIcon } from './occasionSealIcon'
import type { CustomerPage } from '../types/customerPage'
import type { PageTemplate, SaveTemplateOptions } from '../types/pageTemplate'

export type CustomerPageFormState = Omit<
  CustomerPage,
  'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'
>

/** Default form slice for new pages / template application (mirrors PageForm defaultForm). */
export const CUSTOMER_PAGE_FORM_DEFAULTS: CustomerPageFormState = {
  slug: '',
  recipientName: '',
  senderName: '',
  occasion: '',
  occasionIcon: 'heart',
  packageType: 'basic',
  title: '',
  subtitle: '',
  shortMessage: '',
  longLetter: '',
  videoUrl: '',
  gallery: [],
  musicUrl: '',
  status: 'draft',
  unlockAt: null,
  themePreset: 'classic',
  passwordEnabled: false,
  giftAccessPassword: '',
  timedUnlockEnabled: false,
  notifyOnOpen: true,
  musicAutoplay: false,
  themeAccentColor: '',
  themeBackgroundImageUrl: '',
  selectedCardTemplate: 'classic-romantic',
  cardHeadline: '',
  cardSubtext: '',
  cardRecipientName: '',
  allowCustomerEdit: false,
  customerEditToken: null,
  customerEditExpiresAt: null,
}

export function customerPageToFormState(page: CustomerPage): CustomerPageFormState {
  return {
    slug: page.slug,
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
    status: page.status,
    unlockAt: page.unlockAt,
    themePreset: page.themePreset,
    passwordEnabled: page.passwordEnabled,
    giftAccessPassword: page.giftAccessPassword,
    timedUnlockEnabled: page.timedUnlockEnabled,
    notifyOnOpen: page.notifyOnOpen,
    musicAutoplay: page.musicAutoplay,
    themeAccentColor: page.themeAccentColor,
    themeBackgroundImageUrl: page.themeBackgroundImageUrl,
    selectedCardTemplate: page.selectedCardTemplate,
    cardHeadline: page.cardHeadline,
    cardSubtext: page.cardSubtext,
    cardRecipientName: page.cardRecipientName,
    allowCustomerEdit: page.allowCustomerEdit,
    customerEditToken: page.customerEditToken,
    customerEditExpiresAt: page.customerEditExpiresAt,
  }
}

/**
 * Build Firestore payload from current editor state (form snapshot).
 */
export function buildTemplateFirestorePayload(
  form: CustomerPageFormState,
  name: string,
  description: string,
  opts: SaveTemplateOptions,
): Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  const includeText = opts.includeTextContent
  const theme = effectiveThemePreset(form.packageType, form.themePreset)

  return {
    name: name.trim(),
    description: description.trim(),
    packageTier: form.packageType,
    theme,
    occasion: includeText ? form.occasion.trim() : '',
    occasionIcon: form.occasionIcon,
    title: includeText ? form.title.trim() : '',
    subtitle: includeText ? form.subtitle.trim() : '',
    shortMessage: includeText ? form.shortMessage.trim() : '',
    letter: includeText ? form.longLetter.trim() : '',
    musicUrl: opts.includeMusicUrl ? form.musicUrl.trim() : '',
    themeBackgroundUrl: opts.includeThemeBackground ? form.themeBackgroundImageUrl.trim() : '',
    unlockEnabled: form.timedUnlockEnabled,
    unlockDate: form.unlockAt,
    unlockPasswordEnabled: form.passwordEnabled,
    unlockPassword: form.giftAccessPassword.trim(),
    autoplayMusic: form.musicAutoplay,
    notifyOnOpen: form.notifyOnOpen,
  }
}

/** Prefill a new customer page form from a saved template (customer fields stay empty). */
export function templateToNewPageFormState(template: PageTemplate): CustomerPageFormState {
  return {
    ...CUSTOMER_PAGE_FORM_DEFAULTS,
    packageType: template.packageTier,
    themePreset: template.theme,
    occasion: template.occasion,
    occasionIcon: parseOccasionSealIcon(template.occasionIcon),
    title: template.title,
    subtitle: template.subtitle,
    shortMessage: template.shortMessage,
    longLetter: template.letter,
    musicUrl: template.musicUrl,
    themeBackgroundImageUrl: template.themeBackgroundUrl,
    timedUnlockEnabled: template.unlockEnabled,
    unlockAt: template.unlockDate,
    passwordEnabled: template.unlockPasswordEnabled,
    giftAccessPassword: template.unlockPassword,
    musicAutoplay: template.autoplayMusic,
    notifyOnOpen: template.notifyOnOpen,
  }
}
