'use client'

const inputClass =
  'w-full rounded-lg border border-[color:var(--booking-input-border)] bg-[color:var(--booking-input-bg)] px-4 py-3 text-[color:var(--booking-input-text)] placeholder:text-[color:var(--booking-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[color:var(--booking-border)]'
const labelClass = 'mb-1.5 block text-sm font-medium text-[color:var(--booking-fg)]'

type ClientFieldsProps = {
  clientName: string
  clientEmail: string
  clientPhone: string
  onClientName: (v: string) => void
  onClientEmail: (v: string) => void
  onClientPhone: (v: string) => void
}

/** Name, WhatsApp and email of the person booking. */
export function ClientFields({
  clientName,
  clientEmail,
  clientPhone,
  onClientName,
  onClientEmail,
  onClientPhone,
}: ClientFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="clientName" className={labelClass}>
          Nombre y apellido
        </label>
        <input
          id="clientName"
          type="text"
          autoComplete="name"
          required
          value={clientName}
          onChange={(e) => onClientName(e.target.value)}
          className={inputClass}
          placeholder="Tu nombre"
        />
      </div>
      <div>
        <label htmlFor="clientPhone" className={labelClass}>
          WhatsApp
        </label>
        <input
          id="clientPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={clientPhone}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d+]/g, '')
            onClientPhone(raw.startsWith('+') ? `+${raw.replace(/\+/g, '')}` : raw)
          }}
          className={inputClass}
          placeholder="+54 9 351 1234567"
        />
      </div>
      <div>
        <label htmlFor="clientEmail" className={labelClass}>
          Email
        </label>
        <input
          id="clientEmail"
          type="email"
          autoComplete="email"
          required
          value={clientEmail}
          onChange={(e) => onClientEmail(e.target.value)}
          className={inputClass}
          placeholder="tunombre@email.com"
        />
        <p className="mt-1.5 text-xs text-[color:var(--booking-fg-subtle)]">
          Te mandamos la confirmación y el link para cancelar.
        </p>
      </div>
    </>
  )
}
