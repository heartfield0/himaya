import type { CustomerPage } from '../types/customerPage'

export const PACKAGE_TIER_LABEL: Record<CustomerPage['packageType'], string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
}

export const THEME_PRESET_LABEL: Record<CustomerPage['themePreset'], string> = {
  classic: 'Classic',
  rose: 'Rose',
  'warm-minimal': 'Warm Minimal',
}
