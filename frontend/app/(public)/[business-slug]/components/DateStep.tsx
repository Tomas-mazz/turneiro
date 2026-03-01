'use client'

import Image from 'next/image'
import type { Employee, ServiceOption } from '../types'
import { formatDateKey } from '../utils'
import { BookingLayout } from './BookingLayout'

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
  businessName: string
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
  /** Slots when there are no employees (single agenda). */
  slots: string[]
  /** Slots per employee when there are employees; each employee has their own availability. */
  slotsByEmployee: Record<string, string[]>
  slotsLoading: boolean
  selectedSlot: string | null
  onSelectedSlot: (slot: string | null, employeeId: string | null) => void
  onContinue: () => void
  onBack: () => void
  onGoToServices: () => void
  primaryColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
}

export function DateStep({
  businessName,
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
  slotsByEmployee,
  slotsLoading,
  selectedSlot,
  onSelectedSlot,
  onContinue,
  onBack,
  onGoToServices,
  primaryColor,
  isDarkTheme = true,
  onToggleTheme,
}: DateStepProps) {
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
  /** For a given list of slots, filter out past times when the selected date is today. */
  const displaySlotsFor = (slotList: string[]) =>
    selectedDate === todayKey ? slotList.filter((slot) => slot > currentTimeStr) : slotList

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
    <BookingLayout
      businessName={businessName}
      isDarkTheme={isDarkTheme}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
    >
      <div className="flex w-full flex-col">
        {/* Back + service title */}
        <div className="mb-6 flex min-w-0 items-center gap-3 md:mb-8 md:gap-4">
          <button
            type="button"
            onClick={onBack}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${backBtnClass}`}
            aria-label="Volver"
          >
            ←
          </button>
          <h2 className={`min-w-0 truncate text-lg font-semibold md:text-xl ${titleText}`}>
            {selectedService.name} ({selectedService.duration} min)
          </h2>
        </div>

        {/* Month + navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-4">
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
          <div className="space-y-10 md:space-y-12">
            {employees.length > 0 ? (
              employees.map((emp) => {
                const employeeSlots = slotsByEmployee[emp.id] ?? []
                const displaySlotsEmp = displaySlotsFor(employeeSlots)
                return (
                  <div key={emp.id} className="flex flex-col gap-4 md:gap-5">
                    {/* Avatar left; name on top, price (min) below — no card background */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 overflow-visible">
                        <div
                          className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-lg font-medium ${
                            isDarkTheme ? 'bg-neutral-600 text-neutral-200' : 'bg-neutral-300 text-neutral-700'
                          }`}
                        >
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
                      </div>
                      <div>
                        <p className={`font-semibold ${titleText}`}>{emp.name}</p>
                        <p className={`text-sm ${subText}`}>
                          $ {selectedService.price.toFixed(0)} ({selectedService.duration} min)
                        </p>
                      </div>
                    </div>
                    {displaySlotsEmp.length === 0 ? (
                      <div className={`rounded-xl py-6 text-center text-sm ${noSlotsCardClass}`}>
                        Sin turnos disponibles
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
                        {displaySlotsEmp.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              onSelectedSlot(slot, emp.id)
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
                )
              })
            ) : (
              <div className="flex flex-col gap-4 md:gap-5">
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
                  <div className="grid grid-cols-3 gap-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
                    {displaySlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          onSelectedSlot(slot, null)
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
          <div className="mt-10 flex justify-end md:mt-12">
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
    </BookingLayout>
  )
}
