/**
 * WCAG 2.x relative luminance for sRGB hex colors (#RRGGBB).
 * Used to pick foreground UI when the owner sets an arbitrary page background.
 */

const HEX6 = /^#?[0-9A-Fa-f]{6}$/

export function normalizeHex6(input: string, fallback: string): string {
  const s = (input ?? '').trim()
  const h = s.startsWith('#') ? s : `#${s}`
  if (!HEX6.test(h)) return fallback.startsWith('#') ? fallback : `#${fallback}`
  return h.toUpperCase()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

function linearize(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Relative luminance in [0, 1]. */
export function relativeLuminanceFromHex(hex: string): number {
  const rgb = hexToRgb(hex.startsWith('#') ? hex : `#${hex}`)
  if (!rgb) return 0.5
  const R = linearize(rgb.r)
  const G = linearize(rgb.g)
  const B = linearize(rgb.b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** True when light text on dark UI reads better for this background. */
export function isDarkUiForBackground(hex: string): boolean {
  return relativeLuminanceFromHex(hex) < 0.42
}
