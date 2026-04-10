'use client'

import { isDarkUiForBackground, primaryCtaTextClass } from '@/lib/booking'
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

  const titleColor = 'text-[color:var(--booking-modal-fg)]'
  const textColor = 'text-[color:var(--booking-modal-fg-muted)]'
  const border = 'border-[color:var(--booking-modal-border)]'

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm">
      <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6">
        <div
          className="booking-liquid-glass flex max-h-[85vh] min-h-[260px] w-full flex-col overflow-hidden rounded-2xl md:max-w-3xl"
        >
          <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${border}`}>
            <h3 className={`text-base font-semibold md:text-lg ${titleColor}`}>{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[color:var(--booking-modal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--booking-modal-fg-muted)] hover:bg-[color:var(--booking-modal-hover)]"
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
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${primaryCtaTextClass(primaryColor)}`}
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

