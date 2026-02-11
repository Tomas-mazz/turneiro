'use client'

import Image from 'next/image'
import type { Employee, ServiceOption } from '../types'
import { formatDateKey } from '../utils'

const WEEKDAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Visible period: 7 days starting at windowStart (e.g. today through today+6). */
function getVisibleDates(windowStart: Date): Date[] {
  const out: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate() + i)
    out.push(d)
  }
  return out
}

type DateStepProps = {
  selectedService: ServiceOption
  employees: Employee[]
  calendarMonth: Date
  onCalendarMonth: (updater: (d: Date) => Date) => void
  weekAvailability: Record<string, boolean>
  selectedDate: string | null
  onSelectedDate: (date: string | null) => void
  todayKey: string
  /** Current time HH:MM in booking timezone (e.g. Argentina); used to filter past slots for today */
  currentTimeStr?: string
  slots: string[]
  slotsLoading: boolean
  selectedSlot: string | null
  onSelectedSlot: (slot: string | null) => void
  onContinue: () => void
  onBack: () => void
  primaryColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
}

export function DateStep({
  selectedService,
  employees,
  calendarMonth,
  onCalendarMonth,
  weekAvailability,
  selectedDate,
  onSelectedDate,
  todayKey,
  currentTimeStr: currentTimeStrProp,
  slots,
  slotsLoading,
  selectedSlot,
  onSelectedSlot,
  onContinue,
  onBack,
  primaryColor,
  isDarkTheme = true,
  onToggleTheme,
}: DateStepProps) {
  const bgColor = isDarkTheme ? 'hsl(0, 0%, 9%)' : 'rgb(244, 244, 245)'
  const sectionText = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const headerBorder = isDarkTheme ? 'border-neutral-600' : 'border-neutral-300'
  const backBtnClass = isDarkTheme
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600'
    : 'border border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
  const titleText = isDarkTheme ? 'text-white' : 'text-neutral-800'
  const subText = isDarkTheme ? 'text-neutral-400' : 'text-neutral-600'
  const actionBtnClass = isDarkTheme
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600'
    : 'border border-neutral-400 bg-transparent text-neutral-800 hover:bg-neutral-100'
  const navBtnClass = isDarkTheme
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600 disabled:hover:bg-neutral-700/80'
    : 'border border-neutral-400 bg-transparent text-neutral-700 hover:bg-neutral-100 disabled:hover:bg-transparent'
  const noSlotsCardClass = isDarkTheme
    ? 'bg-neutral-700/80 text-neutral-300'
    : 'border border-neutral-200 bg-neutral-100 text-neutral-500'
  const slotBtnClass = isDarkTheme
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600'
    : 'border border-neutral-400 bg-white text-neutral-700 hover:bg-neutral-50'
  const visibleDates = getVisibleDates(calendarMonth)
  const monthLabel = calendarMonth.toLocaleString('es', { month: 'long', year: 'numeric' })

  // When selected date is today, only show slots after current time (HH:MM); use Argentina time when provided
  const currentTimeStr =
    currentTimeStrProp ??
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  const displaySlots =
    selectedDate === todayKey ? slots.filter((slot) => slot > currentTimeStr) : slots

  const goToToday = () => {
    const today = new Date()
    onCalendarMonth(() => today)
    const key = formatDateKey(today)
    if (weekAvailability[key]) onSelectedDate(key)
    else onSelectedDate(null)
  }

  const goToFirstAvailable = () => {
    const sorted = Object.entries(weekAvailability)
      .filter(([, hasSlots]) => hasSlots)
      .map(([date]) => date)
      .sort()
    const first = sorted[0]
    if (first) {
      const [y, m, d] = first.split('-').map(Number)
      onCalendarMonth(() => new Date(y, m - 1, d))
      onSelectedDate(first)
    }
  }

  const goToPreviousWeek = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    onCalendarMonth((d) => {
      const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
      prev.setHours(0, 0, 0, 0)
      return prev < today ? today : prev
    })
  }

  const goToNextWeek = () => {
    onCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))
  }

  const isCurrentWeek = formatDateKey(calendarMonth) === todayKey

  return (
    <section
      className={`min-h-screen transition-colors duration-300 ease-out ${sectionText}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Header: back button + service title */}
      <header className={`border-b py-4 md:py-5 ${headerBorder}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={onBack}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${backBtnClass}`}
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className={`min-w-0 truncate text-lg font-semibold md:text-xl ${titleText}`}>
              {selectedService.name} ({selectedService.duration} min)
            </h1>
          </div>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 ease-out sm:h-11 sm:w-11 ${
                isDarkTheme
                  ? 'border-lime-300 bg-neutral-900 text-neutral-100 hover:border-lime-200'
                  : 'border-indigo-500 bg-white text-neutral-600 hover:border-indigo-400'
              }`}
              aria-label={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDarkTheme ? 'Modo oscuro' : 'Modo claro'}
            >
              {isDarkTheme ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  <path d="M17.5 4.5v2M17.5 9.5v2M15 7h2M20 7h2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        {/* Month + navigation */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-6 md:gap-4">
          <span className={`text-lg font-medium capitalize md:text-xl ${titleText}`}>{monthLabel}</span>
          <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
            <button
              type="button"
              onClick={goToToday}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:px-4 md:py-2.5 ${actionBtnClass}`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={goToFirstAvailable}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:px-4 md:py-2.5 ${actionBtnClass}`}
            >
              Primera hora disponible
            </button>
            <button
              type="button"
              onClick={goToPreviousWeek}
              disabled={isCurrentWeek}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${navBtnClass}`}
              aria-label="Semana anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNextWeek}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${navBtnClass}`}
              aria-label="Semana siguiente"
            >
              ›
            </button>
          </div>
        </div>

        {/* Horizontal date strip: compact on mobile, tablet (md), larger on desktop (lg) */}
        <div className="mt-8 mb-8 flex justify-center gap-2 pb-2 md:gap-3 lg:gap-4">
          {visibleDates.map((d) => {
            const key = formatDateKey(d)
            const isPast = key < todayKey
            const hasSlots = weekAvailability[key] === true
            const isSelected = selectedDate === key
            const canSelect = !isPast && hasSlots
            const dayNum = d.getDate()
            const weekday = WEEKDAY_ABBR[d.getDay()]
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectedDate(key)}
                className={`flex min-w-0 flex-1 flex-col rounded-lg px-2 py-2.5 text-center transition-colors md:min-w-[4.5rem] md:flex-none md:shrink-0 md:rounded-xl md:px-3 md:py-3.5 lg:min-w-[5.5rem] lg:px-4 lg:py-4 ${
                  isDarkTheme
                    ? !canSelect
                      ? 'cursor-pointer bg-neutral-800/60 text-neutral-500 hover:bg-neutral-800/70'
                      : isSelected
                        ? 'border border-neutral-300 bg-white text-neutral-800'
                        : 'bg-neutral-800/80 text-white hover:bg-neutral-700'
                    : !canSelect
                      ? 'cursor-pointer border border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-100'
                      : isSelected
                        ? 'border border-neutral-800 bg-neutral-900 text-white'
                        : 'border border-neutral-400 bg-neutral-100 text-neutral-800 hover:bg-white'
                }`}
              >
                <span
                  className={`text-base font-semibold md:text-lg lg:text-xl ${!canSelect ? 'line-through' : ''}`}
                >
                  {dayNum}
                </span>
                <span className={`text-xs md:text-sm ${!canSelect ? 'line-through' : ''}`}>
                  {weekday}
                </span>
              </button>
            )
          })}
        </div>

        {/* Employees (or single "Horarios") with slots for selected date */}
        {!selectedDate ? (
          <p className={subText}>Seleccioná una fecha para ver horarios disponibles.</p>
        ) : slotsLoading ? (
          <p className={subText}>Cargando horarios...</p>
        ) : (
          <div className="space-y-8">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="flex flex-col gap-3">
                  {/* Avatar left; name on top, price (min) below — no card background */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-400/20 text-lg font-medium text-amber-400">
                      {emp.photoUrl ? (
                        <Image
                          src={emp.photoUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${titleText}`}>{emp.name}</p>
                      <p className={`text-sm ${subText}`}>
                        $ {selectedService.price.toFixed(0)} ({selectedService.duration} min)
                      </p>
                    </div>
                  </div>
                  {displaySlots.length === 0 ? (
                    <div className={`rounded-xl py-6 text-center text-sm ${noSlotsCardClass}`}>
                      Sin turnos disponibles
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-4">
                      {displaySlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            onSelectedSlot(slot)
                            onContinue()
                          }}
                          className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors md:px-4 md:py-3.5 md:text-base lg:px-5 ${slotBtnClass}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <p className={`font-semibold ${titleText}`}>Horarios disponibles</p>
                  <p className={`text-sm ${subText}`}>
                    $ {selectedService.price.toFixed(0)} ({selectedService.duration} min)
                  </p>
                </div>
                {displaySlots.length === 0 ? (
                  <div className={`rounded-xl py-6 text-center text-sm ${noSlotsCardClass}`}>
                    Sin turnos disponibles
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-4">
                    {displaySlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          onSelectedSlot(slot)
                          onContinue()
                        }}
                        className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors md:px-4 md:py-3.5 md:text-base lg:px-5 ${slotBtnClass}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedDate && selectedSlot && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onContinue}
              className="rounded-lg px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
