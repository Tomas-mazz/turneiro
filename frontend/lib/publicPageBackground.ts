/** Matches public booking layout before customization (dark ≈ hsl(0,0%,9%)). */
export const DEFAULT_PUBLIC_PAGE_BG_DARK = '#171717'
/** Matches public booking layout light mode (white). */
export const DEFAULT_PUBLIC_PAGE_BG_LIGHT = '#FFFFFF'

const HEX6 = /^#[0-9A-Fa-f]{6}$/

export function resolvePublicPageBackground(
  isDark: boolean,
  darkStored: string | null | undefined,
  lightStored: string | null | undefined
): string {
  if (isDark) {
    const d = darkStored?.trim()
    if (d && HEX6.test(d)) return d.toUpperCase()
    return DEFAULT_PUBLIC_PAGE_BG_DARK
  }
  const l = lightStored?.trim()
  if (l && HEX6.test(l)) return l.toUpperCase()
  return DEFAULT_PUBLIC_PAGE_BG_LIGHT
}
