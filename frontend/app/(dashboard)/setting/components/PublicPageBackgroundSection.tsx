'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
} from '@/lib/publicPageBackground'

type Props = {
  darkHex: string
  lightHex: string
  onDarkChange: (hex: string) => void
  onLightChange: (hex: string) => void
  onResetToDefaults: () => void
}

function normalizeHexInput(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const h = t.startsWith('#') ? t : `#${t}`
  return /^#[0-9A-Fa-f]{6}$/.test(h) ? h.toUpperCase() : null
}

export function PublicPageBackgroundSection({
  darkHex,
  lightHex,
  onDarkChange,
  onLightChange,
  onResetToDefaults,
}: Props) {
  const [darkDraft, setDarkDraft] = useState(darkHex)
  const [lightDraft, setLightDraft] = useState(lightHex)

  useEffect(() => setDarkDraft(darkHex), [darkHex])
  useEffect(() => setLightDraft(lightHex), [lightHex])

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <h3 className="text-sm font-semibold text-neutral-900">Fondo de la página de reserva</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Solo la reserva pública (servicios, calendario, datos, pago y confirmación). El modo
        oscuro/claro del visitante sigue cambiando textos y paneles; acá definís el color de fondo
        para cada modo.
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Por defecto: oscuro {DEFAULT_PUBLIC_PAGE_BG_DARK}, claro {DEFAULT_PUBLIC_PAGE_BG_LIGHT}.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="font-medium">Fondo modo oscuro</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={darkHex}
              onChange={(e) => onDarkChange(e.target.value.toUpperCase())}
              className="h-10 w-14 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
              aria-label="Color de fondo modo oscuro"
            />
            <input
              type="text"
              value={darkDraft}
              onChange={(e) => setDarkDraft(e.target.value)}
              onBlur={() => {
                const n = normalizeHexInput(darkDraft)
                if (n) onDarkChange(n)
                else setDarkDraft(darkHex)
              }}
              className="min-w-[7.5rem] flex-1 rounded-lg border border-neutral-300 px-2 py-2 font-mono text-sm"
              placeholder="#171717"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="font-medium">Fondo modo claro</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={lightHex}
              onChange={(e) => onLightChange(e.target.value.toUpperCase())}
              className="h-10 w-14 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
              aria-label="Color de fondo modo claro"
            />
            <input
              type="text"
              value={lightDraft}
              onChange={(e) => setLightDraft(e.target.value)}
              onBlur={() => {
                const n = normalizeHexInput(lightDraft)
                if (n) onLightChange(n)
                else setLightDraft(lightHex)
              }}
              className="min-w-[7.5rem] flex-1 rounded-lg border border-neutral-300 px-2 py-2 font-mono text-sm"
              placeholder="#FFFFFF"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </label>
      </div>

      <button
        type="button"
        onClick={onResetToDefaults}
        className="mt-3 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
      >
        Restaurar colores por defecto
      </button>
    </div>
  )
}
