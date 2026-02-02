'use client'

import { formatDateKey } from '../utils'

type DateStepProps = {
  calendarMonth: Date
  onCalendarMonth: (updater: (d: Date) => Date) => void
  weekAvailability: Record<string, boolean>
  selectedDate: string | null
  onSelectedDate: (date: string | null) => void
  todayKey: string
  onContinue: () => void
  primaryColor: string
}

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getMonthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function getMonthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function DateStep({
  calendarMonth,
  onCalendarMonth,
  weekAvailability,
  selectedDate,
  onSelectedDate,
  todayKey,
  onContinue,
  primaryColor,
}: DateStepProps) {
  const start = getMonthStart(calendarMonth)
  const end = getMonthEnd(calendarMonth)
  const firstDay = start.getDay()
  const days: (Date | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i))
  }

  return (
    <section className="py-12 px-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Elegí la fecha</h2>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="p-2 rounded hover:bg-neutral-200"
        >
          ←
        </button>
        <span className="font-medium">
          {calendarMonth.toLocaleString('es', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => onCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="p-2 rounded hover:bg-neutral-200"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1 text-neutral-500 font-medium">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const key = formatDateKey(d)
          const isPast = key < todayKey
          const hasSlots = weekAvailability[key] === true
          const isSelected = selectedDate === key
          const canSelect = !isPast && hasSlots
          return (
            <button
              key={key}
              type="button"
              disabled={!canSelect}
              onClick={() => canSelect && onSelectedDate(key)}
              className={`py-2 rounded ${!canSelect ? 'text-neutral-300 cursor-not-allowed' : isSelected ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-200'}`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Continuar
          </button>
        </div>
      )}
    </section>
  )
}
