import type { CustomerPage } from '../types/customerPage'

const SESSION_KEY_PREFIX = 'himaya_gift_unlock_v1_'

/** Premium + toggle on + non-empty stored phrase → visitors must unlock before the gift page. */
export function giftPasswordGateActive(page: CustomerPage): boolean {
  if (page.packageType !== 'premium') return false
  if (!page.passwordEnabled) return false
  return page.giftAccessPassword.trim().length > 0
}

export function giftUnlockSessionKey(slug: string): string {
  return `${SESSION_KEY_PREFIX}${slug}`
}

export function readGiftUnlockFromSession(slug: string): boolean {
  try {
    return sessionStorage.getItem(giftUnlockSessionKey(slug)) === '1'
  } catch {
    return false
  }
}

export function writeGiftUnlockToSession(slug: string): void {
  try {
    sessionStorage.setItem(giftUnlockSessionKey(slug), '1')
  } catch {
    /* private mode / quota */
  }
}

/** Best-effort constant-time comparison (length still leaks). */
export function constantTimeEqualStrings(a: string, b: string): boolean {
  const na = a.normalize('NFKC')
  const nb = b.normalize('NFKC')
  if (na.length !== nb.length) return false
  let x = 0
  for (let i = 0; i < na.length; i++) {
    x |= na.charCodeAt(i) ^ nb.charCodeAt(i)
  }
  return x === 0
}
