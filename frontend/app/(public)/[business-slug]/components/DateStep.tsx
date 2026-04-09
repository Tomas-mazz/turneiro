'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { AuthUser } from '@/lib/auth'
import type { Employee, ServiceOption } from '../types'
import { formatDateKey } from '../utils'
import { BookingLayout } from './BookingLayout'
import { EmployeeSelectModal } from './EmployeeSelectModal'
import { BookingStepper } from './BookingStepper'

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
  logo?: string | null
  fontFamily?: string | null
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
  /** Unique sorted slot times (union of all employees); used when employees.length > 1. */
  unifiedSlots: string[]
  /** For each slot time, employee ids that have that slot (creation order). */
  employeesBySlot: Record<string, string[]>
  slotsLoading: boolean
  selectedSlot: string | null
  onSelectedSlot: (slot: string | null, employeeId: string | null) => void
  onContinue: () => void
  onBack: () => void
  onGoToServices: () => void
  showPaymentStep?: boolean
  primaryColor: string
  pageBackgroundColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
}

export function DateStep({
  businessName,
  logo,
  fontFamily = 'ROBOTO',
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
  unifiedSlots,
  employeesBySlot,
  slotsLoading,
  selectedSlot,
  onSelectedSlot,
  onContinue,
  onBack,
  onGoToServices,
  showPaymentStep = false,
  primaryColor,
  pageBackgroundColor,
  isDarkTheme = true,
  onToggleTheme,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
}: DateStepProps) {
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

  const [modalSlot, setModalSlot] = useState<string | null>(null)

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
      logo={logo}
      isDarkTheme={isDarkTheme}
      pageBackgroundColor={pageBackgroundColor}
      fontFamily={fontFamily}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
      onOpenLogin={onOpenLogin}
      onOpenRegister={onOpenRegister}
      user={user}
      onLogout={onLogout}
    >
      <div className="flex w-full flex-col">
        <BookingStepper
          step="date"
          isDarkTheme={isDarkTheme}
          showPaymentStep={showPaymentStep}
          onStepChange={(target) => {
            if (target === 'service') {
              onGoToServices()
            }
          }}
        />

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
        ) : employees.length > 1 ? (
          /* Unified calendar: one cell per slot — photos above-left, time below (Step 5 will add modal on click) */
          <div className="flex flex-col gap-4 md:gap-5">
            <div>
              <p className={`font-semibold ${titleText}`}>Horarios disponibles</p>
              <p className={`text-sm ${subText}`}>
                $ {selectedService.price.toFixed(0)} ({selectedService.duration} min)
              </p>
            </div>
            {unifiedSlots.length === 0 ? (
              <div className={`rounded-xl py-6 text-center text-sm ${noSlotsCardClass}`}>
                Sin turnos disponibles
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
                {unifiedSlots.map((slot) => {
                  const slotEmployeeIds = employeesBySlot[slot] ?? []
                  const slotEmployees = slotEmployeeIds
                    .map((id) => employees.find((e) => e.id === id))
                    .filter((e): e is Employee => e != null)
                  const showCount = Math.min(3, slotEmployees.length)
                  const extraCount = slotEmployees.length - showCount
                  const avatarClass = isDarkTheme
                    ? 'bg-neutral-600 text-neutral-200'
                    : 'bg-neutral-300 text-neutral-700'
                  return (
                    <div key={slot} className="flex flex-col items-start gap-1.5">
                      {/* Photos: separate container above and left of the horario box */}
                      <div className="flex min-h-[1.75rem] items-center gap-0.5 pl-0.5">
                        {slotEmployees.slice(0, showCount).map((emp) => (
                          <div
                            key={emp.id}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-medium ${avatarClass}`}
                            aria-hidden
                          >
                            {emp.photoUrl ? (
                              <Image
                                src={emp.photoUrl}
                                alt=""
                                width={28}
                                height={28}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <span className={`text-xs font-medium ${isDarkTheme ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            +{extraCount}
                          </span>
                        )}
                      </div>
                      {/* Horario: its own box (button), separate from photos — opens modal on click */}
                      <button
                        type="button"
                        onClick={() => setModalSlot(slot)}
                        className={`w-full rounded-lg px-3 py-3 text-sm font-medium transition-colors md:px-4 md:py-3.5 md:text-base lg:px-5 ${slotBtnClass}`}
                        aria-label={`Horario ${slot}${slotEmployees.length > 0 ? `, ${slotEmployees.length} disponible${slotEmployees.length === 1 ? '' : 's'}` : ''}`}
                      >
                        {slot}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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

        {selectedDate && selectedSlot && employees.length <= 1 && (
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

        {employees.length > 1 && (
          <EmployeeSelectModal
            isOpen={modalSlot != null}
            slotTime={modalSlot ?? ''}
            employees={employees}
            availableEmployeeIds={employeesBySlot[modalSlot ?? ''] ?? []}
            onSelect={(employeeId) => {
              if (modalSlot) {
                onSelectedSlot(modalSlot, employeeId)
                onContinue()
                setModalSlot(null)
              }
            }}
            onClose={() => setModalSlot(null)}
            isDarkTheme={isDarkTheme}
            primaryColor={primaryColor}
          />
        )}
      </div>
    </BookingLayout>
  )
}
