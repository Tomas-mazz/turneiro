'use client'

type SlotGridProps = {
  slots: string[]
  selectedSlot: string | null
  onSelect: (slot: string) => void
  loading: boolean
  /** Shown instead of the grid when there is nothing to pick yet. */
  placeholder?: string | null
  emptyMessage?: string
}

/** Available start times for the selected day. */
export function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
  loading,
  placeholder,
  emptyMessage = 'No quedan turnos este día. Probá con otra fecha.',
}: SlotGridProps) {
  const messageClass =
    'rounded-xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] px-4 py-6 text-center text-sm text-[color:var(--booking-fg-muted)]'

  if (placeholder) return <p className={messageClass}>{placeholder}</p>

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true" aria-label="Cargando horarios">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-[color:var(--booking-control-bg)]" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) return <p className={messageClass}>{emptyMessage}</p>

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const selected = slot === selectedSlot
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={selected}
            className={`h-11 rounded-lg text-sm font-medium transition-colors ${
              selected
                ? 'bg-[color:var(--booking-selected-bg)] text-[color:var(--booking-selected-fg)]'
                : 'border border-[color:var(--booking-border)] bg-[color:var(--booking-control-bg)] text-[color:var(--booking-control-text)] hover:bg-[color:var(--booking-control-hover)]'
            }`}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
