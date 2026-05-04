'use client'

import { useState, useEffect } from 'react'
import { primaryCtaTextClass } from '@/lib/booking'

export type BookingAddOnItem = { id: string; name: string; price: number }

type Props = {
  open: boolean
  title?: string
  items: BookingAddOnItem[]
  primaryColor: string
  pageBackgroundColor: string
  isDarkTheme?: boolean
  onClose: () => void
  onConfirm: (selected: BookingAddOnItem[]) => void
  /** User explicitly continues without extras */
  onWithoutAddOns: () => void
}

export function BookingAddOnsModal({
  open,
  title = 'Agregar adicionales',
  items,
  primaryColor,
  pageBackgroundColor,
  isDarkTheme = true,
  onClose,
  onConfirm,
  onWithoutAddOns,
}: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) setPicked(new Set())
  }, [open, items])

  if (!open) return null

  const fg = 'text-[color:var(--booking-fg)]'
  const muted = 'text-[color:var(--booking-fg-muted)]'
  const border = 'border-[color:var(--booking-divide)]'

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedRows = items.filter((i) => picked.has(i.id))
  const extraTotal = selectedRows.reduce((a, i) => a + i.price, 0)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-addons-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={`relative z-[81] w-full max-w-lg rounded-t-2xl border ${border} p-5 shadow-xl sm:rounded-2xl sm:p-6`}
        style={{ backgroundColor: pageBackgroundColor }}
      >
        <h2 id="booking-addons-title" className={`text-lg font-semibold ${fg}`}>
          {title}
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>Podés elegir varios o continuar sin adicionales.</p>

        <ul className={`mt-4 max-h-[45vh] space-y-2 overflow-y-auto border-t ${border} pt-3`}>
          {items.map((item) => {
            const checked = picked.has(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    checked ? 'border-opacity-80' : border
                  }`}
                  style={
                    checked
                      ? {
                          borderColor: primaryColor,
                          backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        }
                      : undefined
                  }
                >
                  <span className={`min-w-0 flex-1 font-medium ${fg}`}>{item.name}</span>
                  <span className={`shrink-0 font-semibold ${fg}`}>$ {item.price.toFixed(0)}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {selectedRows.length > 0 && (
          <p className={`mt-3 text-sm ${muted}`}>
            Adicionales: <span className="font-semibold text-[color:var(--booking-fg)]">$ {extraTotal.toFixed(0)}</span>
          </p>
        )}

        <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <button
            type="button"
            onClick={onWithoutAddOns}
            className={`self-center border-0 bg-transparent py-2 text-left text-sm font-normal ${muted} underline-offset-4 outline-none ring-0 transition-opacity hover:underline hover:opacity-90 focus-visible:underline sm:self-auto`}
          >
            Sin adicionales
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedRows)}
            className={`min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold sm:min-w-[10rem] ${primaryCtaTextClass(primaryColor)}`}
            style={{ backgroundColor: primaryColor }}
          >
            Continuar
            {selectedRows.length > 0 ? ` ($ ${extraTotal.toFixed(0)})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
