function parseHex6(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

/**
 * Linear blend from `fromHex` toward `toHex`. t=0 → from, t=1 → to.
 * Example: mixHex('#440066', '#FFFFFF', 0.8) → ~80% toward white (tinted “card”).
 */
export function mixHex(fromHex: string, toHex: string, t: number): string {
  const a = parseHex6(fromHex.includes('#') ? fromHex : `#${fromHex}`)
  const b = parseHex6(toHex.includes('#') ? toHex : `#${toHex}`)
  if (!a || !b) return fromHex.startsWith('#') ? fromHex : `#${fromHex}`
  const u = Math.min(1, Math.max(0, t))
  const r = Math.round(a.r + (b.r - a.r) * u)
  const g = Math.round(a.g + (b.g - a.g) * u)
  const bl = Math.round(a.b + (b.b - a.b) * u)
  const out = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${out(r)}${out(g)}${out(bl)}`
}

/** Subtle border on a light tinted surface (darken a bit toward black). */
export function mixTowardBlack(surfaceHex: string, amount: number): string {
  return mixHex(surfaceHex, '#0a0a0a', amount)
}
