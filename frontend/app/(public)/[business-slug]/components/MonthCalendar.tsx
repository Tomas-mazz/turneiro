'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateKey } from '../utils'

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

type MonthCalendarProps = {
  /** Any date inside the month to show. */
  month: Date
  onMonthChange: (month: Date) => void
  selectedDate: string | null
  onSelectDate: (dateKey: string) => void
  /** Today in Argentina, YYYY-MM-DD. */
  todayKey: string
  /** Last bookable date, YYYY-MM-DD. */
  maxDateKey: string
  /** Weekdays (0 = Sunday) the business opens. */
  openWeekdays: Set<number>
  /** Known availability per date; false greys the day out. Missing = not checked yet. */
  availability: Record<string, boolean>
  disabled?: boolean
}

/** Monday-first month grid. Days are bookable when open, not past and within the booking window. */
export function MonthCalendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  todayKey,
  maxDateKey,
  openWeekdays,
  availability,
  disabled = false,
}: MonthCalendarProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leadingBlanks = (first.getDay() + 6) % 7
  const monthLabel = first.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const firstOfThisMonthKey = `${todayKey.slice(0, 7)}-01`
  const canGoPrev = formatDateKey(first) > firstOfThisMonthKey
  const canGoNext = formatDateKey(new Date(year, monthIndex + 1, 1)) <= maxDateKey

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ]

  const navBtn =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--booking-border)] bg-[color:var(--booking-control-bg)] text-[color:var(--booking-control-text)] transition-colors hover:bg-[color:var(--booking-control-hover)] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : undefined} aria-disabled={disabled}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className={navBtn}
          disabled={!canGoPrev}
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-semibold first-letter:uppercase text-[color:var(--booking-fg)]">{monthLabel}</span>
        <button
          type="button"
          className={navBtn}
          disabled={!canGoNext}
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 text-xs font-medium text-[color:var(--booking-fg-subtle)]">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />
          const key = formatDateKey(date)
          const bookable =
            key >= todayKey &&
            key <= maxDateKey &&
            openWeekdays.has(date.getDay()) &&
            availability[key] !== false
          const selected = key === selectedDate
          const isToday = key === todayKey
          return (
            <button
              key={key}
              type="button"
              disabled={!bookable}
              onClick={() => onSelectDate(key)}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                selected
                  ? 'bg-[color:var(--booking-fg)] text-[color:var(--booking-page-bg)]'
                  : bookable
                    ? 'text-[color:var(--booking-fg)] hover:bg-[color:var(--booking-control-hover)]'
                    : 'cursor-not-allowed text-[color:var(--booking-fg-subtle)] opacity-40'
              } ${isToday && !selected ? 'ring-1 ring-inset ring-[color:var(--booking-border)]' : ''}`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
