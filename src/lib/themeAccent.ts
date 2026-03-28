import type { CSSProperties } from 'react'
import type { CustomerPage } from '../types/customerPage'
import { getPackageCapabilities } from './packageCapabilities'

export function parseHexColor(input: string): string | null {
  const s = input.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const a = s.slice(1)
    return `#${a[0]}${a[0]}${a[1]}${a[1]}${a[2]}${a[2]}`.toLowerCase()
  }
  return null
}

/** Empty string clears; invalid input becomes empty (caller may show validation). */
export function normalizeAccentForStorage(input: string): string {
  const t = input.trim()
  if (!t) return ''
  return parseHexColor(t) ?? ''
}

function hexToRgbTuple(hex: string): [number, number, number] | null {
  const n = parseHexColor(hex)
  if (!n) return null
  const v = parseInt(n.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function rgbTupleToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/** Fallback for `<input type="color">` when no custom accent is stored. */
export const ACCENT_PICKER_FALLBACK = '#9c6b5c'

export function accentPickerDisplayValue(stored: string): string {
  return parseHexColor(stored.trim()) ?? ACCENT_PICKER_FALLBACK
}

export function accentCssVariables(hex: string): CSSProperties | undefined {
  const n = parseHexColor(hex)
  if (!n) return undefined
  const rgb = hexToRgbTuple(n)
  if (!rgb) return undefined
  const dim = rgbTupleToHex(mixRgb(rgb, [24, 18, 14], 0.42))
  const light = rgbTupleToHex(mixRgb(rgb, [255, 252, 248], 0.38))
  return {
    '--pub-accent': n,
    '--pub-accent-rgb': `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`,
    '--pub-accent-dim': dim,
    '--pub-accent-light': light,
  } as CSSProperties
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** Accent hex for public page when tier allows custom theme and value is valid. */
export function resolvePublicPremiumAccentHex(page: CustomerPage): string | null {
  if (!getPackageCapabilities(page.packageType).customThemeBuilder) return null
  return parseHexColor(page.themeAccentColor.trim())
}

/** Background image URL when tier allows and URL looks usable. */
export function resolvePublicPremiumBackgroundUrl(page: CustomerPage): string | null {
  if (!getPackageCapabilities(page.packageType).customThemeBuilder) return null
  const u = page.themeBackgroundImageUrl.trim()
  if (!u || !isHttpUrl(u)) return null
  return u
}
