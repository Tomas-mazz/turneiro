'use client'

type PublicTheme = 'LIGHT' | 'DARK'

type Props = {
  value: PublicTheme
  onChange: (v: PublicTheme) => void
}

export function PublicDefaultThemeSection({ value, onChange }: Props) {
  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <h3 className="text-sm font-semibold text-neutral-900">Tema por defecto (página pública)</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Elegí si los visitantes ven primero el modo claro u oscuro. Siempre pueden cambiar con el botón
        de tema en la reserva.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {(
          [
            { key: 'LIGHT' as const, label: 'Modo claro primero' },
            { key: 'DARK' as const, label: 'Modo oscuro primero' },
          ] as const
        ).map((opt) => {
          const selected = value === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                selected
                  ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-400'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
