'use client'

import { FocusImageCarousel } from './FocusImageCarousel'

type Props = {
  open: boolean
  title: string
  images: string[]
  shortDescription?: string | null
  description?: string | null
  isDarkTheme?: boolean
  primaryColor: string
  onClose: () => void
  onConfirm: () => void
}

export function ServiceAboutModal({
  open,
  title,
  images,
  shortDescription,
  description,
  isDarkTheme = true,
  primaryColor,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null

  const panelBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white'
  const titleColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const textColor = isDarkTheme ? 'text-neutral-200' : 'text-neutral-700'
  const border = isDarkTheme ? 'border-neutral-700' : 'border-neutral-200'

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="fixed inset-0 p-0 md:flex md:items-center md:justify-center md:p-6">
        <div
          className={`h-full w-full ${panelBg} md:h-auto md:max-h-[85vh] md:max-w-3xl md:rounded-2xl md:border ${border} md:shadow-2xl`}
        >
          <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${border}`}>
            <h3 className={`text-base font-semibold md:text-lg ${titleColor}`}>{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                isDarkTheme
                  ? 'border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                  : 'border-neutral-200 text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              Cerrar
            </button>
          </div>

          <div className="h-[calc(100%-64px)] overflow-y-auto px-5 py-5 md:h-auto">
            {images?.length ? (
              <FocusImageCarousel images={images} title={title} isDarkTheme={isDarkTheme} />
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

            <div className="mt-6">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Confirmar
              </button>
              <p className={`mt-2 text-center text-xs ${textColor}`}>
                Confirmá para continuar al calendario.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

