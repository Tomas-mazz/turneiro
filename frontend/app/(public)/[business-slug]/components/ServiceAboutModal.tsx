'use client'

import { isDarkUiForBackground } from '@/lib/booking'
import { FocusImageCarousel } from './FocusImageCarousel'

type Props = {
  open: boolean
  title: string
  images: string[]
  shortDescription?: string | null
  description?: string | null
  /** When set, carousel chrome follows contrast of the page background. */
  pageBackgroundColor?: string | null
  isDarkTheme?: boolean
  primaryColor: string
  showConfirmButton?: boolean
  onClose: () => void
  onConfirm: () => void
}

function parseColorToRgb(input: string): { r: number; g: number; b: number } | null {
  const v = (input ?? '').trim().toLowerCase()
  if (!v) return null

  // #rgb / #rrggbb
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

  // rgb() / rgba()
  const m = v.match(/^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/)
  if (m) {
    const r = Number(m[1])
    const g = Number(m[2])
    const b = Number(m[3])
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    return { r, g, b }
  }

  return null
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  // sRGB → linear
  const toLin = (c: number) => {
    const x = c / 255
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  const R = toLin(r)
  const G = toLin(g)
  const B = toLin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function ServiceAboutModal({
  open,
  title,
  images,
  shortDescription,
  description,
  pageBackgroundColor = null,
  isDarkTheme = true,
  primaryColor,
  showConfirmButton = false,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null

  const carouselDark =
    pageBackgroundColor != null && pageBackgroundColor !== ''
      ? isDarkUiForBackground(pageBackgroundColor)
      : isDarkTheme

  const panelBg = 'bg-[color:var(--booking-modal-bg)]'
  const titleColor = 'text-[color:var(--booking-fg)]'
  const textColor = 'text-[color:var(--booking-fg-muted)]'
  const border = 'border-[color:var(--booking-modal-border)]'
  const rgb = parseColorToRgb(primaryColor)
  const isLightPrimary = rgb ? relativeLuminance(rgb) > 0.72 : false
  const ctaText = isLightPrimary ? 'text-neutral-900' : 'text-white'

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6">
        <div
          className={`flex w-full flex-col ${panelBg} ${border} shadow-2xl
            max-h-[85vh] min-h-[260px] rounded-2xl border
            md:max-w-3xl`}
        >
          <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${border}`}>
            <h3 className={`text-base font-semibold md:text-lg ${titleColor}`}>{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[color:var(--booking-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--booking-fg-muted)] hover:bg-[color:var(--booking-row-hover)]"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {images?.length ? (
              <FocusImageCarousel images={images} title={title} isDarkTheme={carouselDark} />
            ) : null}

            {(shortDescription || description) && (
              <div className="mt-5">
                {shortDescription ? (
                  <p className={`text-sm font-medium ${textColor}`}>{shortDescription}</p>
                ) : null}
                {description ? (
                  <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${textColor}`}>{description}</p>
                ) : null}
              </div>
            )}

            {showConfirmButton && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${ctaText}`}
                  style={{ backgroundColor: primaryColor }}
                >
                  Continuar
                </button>
                <p className={`mt-2 text-center text-xs ${textColor}`}>
                  Continuá para ir al calendario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

