import type { CustomerPage, PackageType } from '../types/customerPage'

export type ThemePreset = CustomerPage['themePreset']

/**
 * Single source of truth for what each bouquet tier may use in the editor and on the public page.
 */
export interface PackageCapabilities {
  /** 0 = no gallery UI; otherwise max images saved/shown */
  maxGalleryImages: number
  video: boolean
  music: boolean
  themePresets: readonly ThemePreset[]
  /** Envelope / “Open Letter” intro overlay */
  giftIntroEnvelope: boolean
  unlockDateField: boolean
  timedUnlockToggle: boolean
  customSlug: boolean
  notifyOnOpen: boolean
  musicAutoplay: boolean
  passwordToggle: boolean
  /** Timed gift card before unlock time on the public page */
  publicTimedUnlock: boolean
  /** Accent color + background image theme builder */
  customThemeBuilder: boolean
  /** Custom envelope seal icon on gift intro */
  occasionSealIconPicker: boolean
}

const CAPABILITIES: Record<PackageType, PackageCapabilities> = {
  basic: {
    maxGalleryImages: 0,
    video: false,
    music: true,
    themePresets: ['classic'],
    giftIntroEnvelope: false,
    unlockDateField: false,
    timedUnlockToggle: false,
    customSlug: true,
    notifyOnOpen: false,
    musicAutoplay: false,
    passwordToggle: false,
    publicTimedUnlock: false,
    customThemeBuilder: false,
    occasionSealIconPicker: false,
  },
  standard: {
    maxGalleryImages: 8,
    video: true,
    music: true,
    themePresets: ['classic', 'rose'],
    giftIntroEnvelope: true,
    unlockDateField: true,
    timedUnlockToggle: true,
    customSlug: true,
    notifyOnOpen: true,
    musicAutoplay: true,
    passwordToggle: false,
    publicTimedUnlock: true,
    customThemeBuilder: false,
    occasionSealIconPicker: true,
  },
  premium: {
    maxGalleryImages: 24,
    video: true,
    music: true,
    themePresets: ['classic', 'rose', 'warm-minimal'],
    giftIntroEnvelope: true,
    unlockDateField: true,
    timedUnlockToggle: true,
    customSlug: true,
    notifyOnOpen: true,
    musicAutoplay: true,
    passwordToggle: true,
    publicTimedUnlock: true,
    customThemeBuilder: true,
    occasionSealIconPicker: true,
  },
}

export function getPackageCapabilities(tier: PackageType): PackageCapabilities {
  return CAPABILITIES[tier]
}

export function effectiveThemePreset(tier: PackageType, stored: ThemePreset): ThemePreset {
  const { themePresets } = getPackageCapabilities(tier)
  return (themePresets as readonly string[]).includes(stored) ? stored : themePresets[0]
}

export function clipGalleryUrlsForTier(tier: PackageType, urls: string[]): string[] {
  const max = getPackageCapabilities(tier).maxGalleryImages
  if (max <= 0) return []
  return urls.slice(0, max)
}

export function publicMusicAutoplayAllowed(tier: PackageType, pageWantsAutoplay: boolean): boolean {
  return pageWantsAutoplay && getPackageCapabilities(tier).musicAutoplay
}
