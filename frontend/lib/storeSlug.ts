/**
 * Subdomain store slug from window.location (same rules as middleware).
 */
export function getStoreSlugFromHostname(hostname: string): string | null {
  const lower = hostname.toLowerCase().split(':')[0]
  if (lower === 'localhost' || lower === '127.0.0.1') return null
  if (lower.endsWith('.localhost')) {
    const base = lower.replace(/\.localhost$/, '')
    return base || null
  }
  if (lower.endsWith('.turneiro.com')) {
    const base = lower.replace(/\.turneiro\.com$/, '')
    if (base === 'www' || base === '') return null
    return base || null
  }
  return null
}

export function getStoreSlugFromWindow(): string | null {
  if (typeof window === 'undefined') return null
  return getStoreSlugFromHostname(window.location.hostname)
}

/** Admin panel on apex (no store context). */
export function getMainAppOrigin(): string {
  if (typeof window === 'undefined') return ''
  const env = process.env.NEXT_PUBLIC_MAIN_APP_ORIGIN?.replace(/\/$/, '')
  if (env) return env
  const host = window.location.hostname.toLowerCase()
  if (host.endsWith('.turneiro.com')) return `${window.location.protocol}//turneiro.com`
  return `${window.location.protocol}//${window.location.host}`
}
