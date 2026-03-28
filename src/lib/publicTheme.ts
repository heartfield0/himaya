import type { CustomerPage, PackageType } from '../types/customerPage'
import { effectiveThemePreset } from './packageCapabilities'

const THEME_CLASS: Record<CustomerPage['themePreset'], string> = {
  classic: 'theme-classic',
  rose: 'theme-rose',
  'warm-minimal': 'theme-warm-minimal',
}

/** CSS class on `<article class="public-page">` — respects package tier + saved preset. */
export function resolvePublicThemeClass(packageType: PackageType, themePreset: CustomerPage['themePreset']): string {
  return THEME_CLASS[effectiveThemePreset(packageType, themePreset)]
}
