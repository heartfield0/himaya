/** URL-safe token for `?token=` (≈256 bits, no padding). */
export function generateCustomerEditToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  const b64 = btoa(bin)
  return b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
