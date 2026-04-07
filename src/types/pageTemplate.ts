import type { CustomerPage, OccasionSealIconId, PackageType } from './customerPage'

/**
 * Firestore `templates` collection — reusable page blueprints (MVP: no gallery/video/slug).
 */
export interface PageTemplate {
  id: string
  name: string
  description: string
  packageTier: PackageType
  /** Maps to CustomerPage.themePreset */
  theme: CustomerPage['themePreset']
  occasion: string
  occasionIcon: OccasionSealIconId
  title: string
  subtitle: string
  shortMessage: string
  /** Maps to CustomerPage.longLetter */
  letter: string
  musicUrl: string
  /** Maps to CustomerPage.themeBackgroundImageUrl */
  themeBackgroundUrl: string
  /** Maps to CustomerPage.timedUnlockEnabled */
  unlockEnabled: boolean
  /** ISO string or null; maps to CustomerPage.unlockAt */
  unlockDate: string | null
  /** Maps to CustomerPage.passwordEnabled */
  unlockPasswordEnabled: boolean
  /** Maps to CustomerPage.giftAccessPassword */
  unlockPassword: string
  /** Maps to CustomerPage.musicAutoplay */
  autoplayMusic: boolean
  notifyOnOpen: boolean
  createdAt: string
  updatedAt: string
}

export type SaveTemplateOptions = {
  includeTextContent: boolean
  includeMusicUrl: boolean
  includeThemeBackground: boolean
}
