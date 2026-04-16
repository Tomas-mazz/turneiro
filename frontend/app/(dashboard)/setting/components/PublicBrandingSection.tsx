'use client'

import { useEffect, useMemo, useState } from 'react'
import { bookingDerivedBackground } from '@/lib/booking'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
} from '@/lib/publicPageBackground'

type Intensity = 'SOFT' | 'NORMAL' | 'STRONG'

type Props = {
  brandColor: string | null
  intensity: Intensity | null
  useGradient: boolean
  legacyDarkHex: string
  legacyLightHex: string
  onBrandColor: (hexOrNull: string | null) => void
  onIntensity: (v: Intensity) => void
  onUseGradient: (v: boolean) => void
  onReset: () => void
}

function normalizeHexInput(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const h = t.startsWith('#') ? t : `#${t}`
  return /^#[0-9A-Fa-f]{6}$/.test(h) ? h.toUpperCase() : null
}

const PRESETS: Array<{ label: string; hex: string }> = [
  { label: 'Rosa', hex: '#E24A8D' },
  { label: 'Violeta', hex: '#7C4DFF' },
  { label: 'Azul', hex: '#2563EB' },
  { label: 'Turquesa', hex: '#06B6D4' },
  { label: 'Verde', hex: '#16A34A' },
  { label: 'Naranja', hex: '#F97316' },
  { label: 'Rojo', hex: '#DC2626' },
  { label: 'Gris', hex: '#525252' },
]

export function PublicBrandingSection({
  brandColor,
  intensity,
  useGradient,
  legacyDarkHex,
  legacyLightHex,
  onBrandColor,
  onIntensity,
  onUseGradient,
  onReset,
}: Props) {
  const [draft, setDraft] = useState(brandColor ?? '')

  useEffect(() => setDraft(brandColor ?? ''), [brandColor])

  const effectiveBrandColor = useMemo(() => {
    const n = normalizeHexInput(draft)
    return n ?? brandColor
  }, [brandColor, draft])

  const darkPreview = useMemo(
    () =>
      bookingDerivedBackground({
        brandColor: effectiveBrandColor,
        intensity: intensity ?? 'SOFT',
        useGradient,
        variant: 'DARK',
        legacyBackground: legacyDarkHex || DEFAULT_PUBLIC_PAGE_BG_DARK,
      }),
    [effectiveBrandColor, intensity, useGradient, legacyDarkHex]
  )
  const lightPreview = useMemo(
    () =>
      bookingDerivedBackground({
        brandColor: effectiveBrandColor,
        intensity: intensity ?? 'SOFT',
        useGradient,
        variant: 'LIGHT',
        legacyBackground: legacyLightHex || DEFAULT_PUBLIC_PAGE_BG_LIGHT,
      }),
    [effectiveBrandColor, intensity, useGradient, legacyLightHex]
  )

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <h3 className="text-sm font-semibold text-neutral-900">Color de marca (recomendado)</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Elegís un color principal y la reserva genera un fondo más suave por defecto (mejor contraste y
        menos saturación). Si querés, podés activar un gradiente sutil.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <label className="flex flex-col gap-2 text-sm text-neutral-800">
            <span className="font-medium">Color de marca</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={effectiveBrandColor ?? '#000000'}
                onChange={(e) => onBrandColor(e.target.value.toUpperCase())}
                className="h-10 w-14 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
                aria-label="Color de marca"
              />
              <input
                type="text"
                value={draft}
                onChange={(e) => {
                  const next = e.target.value
                  setDraft(next)
                  const n = normalizeHexInput(next)
                  if (n) onBrandColor(n)
                  if (!next.trim()) onBrandColor(null)
                }}
                onBlur={() => {
                  const n = normalizeHexInput(draft)
                  if (n) onBrandColor(n)
                  else if (!draft.trim()) onBrandColor(null)
                  else setDraft(brandColor ?? '')
                }}
                className="min-w-[7.5rem] flex-1 rounded-lg border border-neutral-300 px-2 py-2 font-mono text-sm"
                placeholder="Ej. #E24A8D"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => onBrandColor(null)}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Usar legacy
              </button>
            </div>
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-neutral-800">
              <span className="font-medium">Intensidad</span>
              <select
                value={(intensity ?? 'SOFT') as Intensity}
                onChange={(e) => onIntensity(e.target.value as Intensity)}
                className="rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="SOFT">Suave (recomendado)</option>
                <option value="NORMAL">Normal</option>
                <option value="STRONG">Fuerte</option>
              </select>
            </label>

            <label className="flex items-center gap-2 self-end text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={useGradient}
                onChange={(e) => onUseGradient(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span className="font-medium">Gradiente sutil</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.hex}
                type="button"
                onClick={() => onBrandColor(p.hex)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-neutral-300"
                  style={{ backgroundColor: p.hex }}
                  aria-hidden
                />
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="mt-3 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
          >
            Restaurar recomendados
          </button>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">Vista previa</div>
          <p className="mt-1 text-xs text-neutral-500">
            Fondo derivado para oscuro y claro (lo que se usa para la reserva pública).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="text-xs font-medium text-neutral-700">Oscuro</div>
              <div
                className="mt-2 h-14 rounded-lg border border-neutral-200"
                style={{
                  backgroundColor: darkPreview.backgroundHex,
                  ...(darkPreview.backgroundImage ? { backgroundImage: darkPreview.backgroundImage } : {}),
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                }}
              />
              <div className="mt-2 font-mono text-[11px] text-neutral-600">{darkPreview.backgroundHex}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="text-xs font-medium text-neutral-700">Claro</div>
              <div
                className="mt-2 h-14 rounded-lg border border-neutral-200"
                style={{
                  backgroundColor: lightPreview.backgroundHex,
                  ...(lightPreview.backgroundImage ? { backgroundImage: lightPreview.backgroundImage } : {}),
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                }}
              />
              <div className="mt-2 font-mono text-[11px] text-neutral-600">{lightPreview.backgroundHex}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

