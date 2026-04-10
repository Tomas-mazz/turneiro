/**
 * Classes for a primary action button on a light surface (modal) so text stays readable
 * for both dark and light brand colors (e.g. #171717 vs #f5f5f5).
 */
export function parseHexToRgb(input: string): { r: number; g: number; b: number } | null {
  const v = (input ?? '').trim().toLowerCase()
  if (!v) return null
  if (v.startsWith('#')) {
    const hex = v.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      if ([r, g, b].some((n) => Number.isNaN(n))) return null
      return { r, g, b }
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if ([r, g, b].some((n) => Number.isNaN(n))) return null
      return { r, g, b }
    }
  }
  return null
}

function relativeLuminanceRgb({ r, g, b }: { r: number; g: number; b: number }) {
  const toLin = (c: number) => {
    const x = c / 255
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  const R = toLin(r)
  const G = toLin(g)
  const B = toLin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** Tailwind text + optional border when the fill is very light on a light modal. */
export function primaryCtaTextClass(primaryColor: string): string {
  const rgb = parseHexToRgb(primaryColor) ?? { r: 23, g: 23, b: 23 }
  const L = relativeLuminanceRgb(rgb)
  if (L > 0.55) {
    return 'text-neutral-900 border border-neutral-300/90 shadow-sm'
  }
  return 'text-white shadow-md ring-2 ring-black/20'
}
