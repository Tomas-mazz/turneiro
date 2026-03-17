'use client'

type Props = {
  open: boolean
  title: string
  isDarkTheme?: boolean
  primaryColor: string
  onBack: () => void
  onContinue: () => void
}

export function ServiceConfirmModal({
  open,
  title,
  isDarkTheme = true,
  primaryColor,
  onBack,
  onContinue,
}: Props) {
  if (!open) return null

  const panelBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white'
  const titleColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const textColor = isDarkTheme ? 'text-neutral-200' : 'text-neutral-700'
  const border = isDarkTheme ? 'border-neutral-700' : 'border-neutral-200'

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="fixed inset-0 flex items-center justify-center p-5">
        <div className={`w-full max-w-md rounded-2xl border ${border} ${panelBg} p-5 shadow-2xl`}>
          <h3 className={`text-base font-semibold ${titleColor}`}>¿Continuar?</h3>
          <p className={`mt-2 text-sm ${textColor}`}>
            Estás seleccionando: <span className="font-semibold">{title}</span>
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onBack}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                isDarkTheme
                  ? 'border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                  : 'border-neutral-200 text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

