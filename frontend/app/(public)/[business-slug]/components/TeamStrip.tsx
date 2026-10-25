'use client'

import Image from 'next/image'
import { Check, Users } from 'lucide-react'
import type { Employee } from '../types'

type TeamStripProps = {
  employees: Employee[]
  /** null = "Cualquiera" (first available professional). */
  selectedEmployeeId: string | null
  onSelect: (employeeId: string | null) => void
  /** Employees who can do the selected services; others are shown dimmed. null = all. */
  eligibleEmployeeIds: string[] | null
  /** Tapping a professional opens their profile (from the card's position) instead of selecting. */
  onOpenProfile?: (employeeId: string, origin: { x: number; y: number; width: number; height: number }) => void
}

const cardBase =
  'relative flex w-[112px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border text-left transition-colors md:w-[128px]'

function cardClass(selected: boolean, disabled: boolean) {
  if (disabled) return `${cardBase} border-[color:var(--booking-border-soft)] opacity-40`
  return selected
    ? `${cardBase} border-[color:var(--booking-fg)] bg-[color:var(--booking-card-bg)] shadow-sm ring-1 ring-[color:var(--booking-fg)]`
    : `${cardBase} border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] shadow-sm hover:border-[color:var(--booking-border)]`
}

function SelectedBadge() {
  return (
    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--booking-fg)] text-[color:var(--booking-page-bg)]">
      <Check className="h-4 w-4" aria-hidden />
    </span>
  )
}

/** Team picker: choose a professional or let the shop assign the first one available. */
export function TeamStrip({
  employees,
  selectedEmployeeId,
  onSelect,
  eligibleEmployeeIds,
  onOpenProfile,
}: TeamStripProps) {
  if (employees.length < 2) return null

  return (
    <section aria-labelledby="team-title">
      <h2 id="team-title" className="mb-3 text-lg font-semibold text-[color:var(--booking-fg)] md:text-center md:text-xl">
        Elegí con quién
      </h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedEmployeeId === null}
          className={cardClass(selectedEmployeeId === null, false)}
        >
          {selectedEmployeeId === null && <SelectedBadge />}
          <div className="flex aspect-square w-full items-center justify-center bg-[color:var(--booking-avatar-bg)] text-[color:var(--booking-avatar-text)]">
            <Users className="h-9 w-9" aria-hidden />
          </div>
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-[color:var(--booking-fg)]">Cualquiera</p>
            <p className="truncate text-xs text-[color:var(--booking-fg-muted)]">Primero disponible</p>
          </div>
        </button>

        {employees.map((emp) => {
          const disabled = eligibleEmployeeIds !== null && !eligibleEmployeeIds.includes(emp.id)
          const selected = selectedEmployeeId === emp.id
          return (
            <button
              key={emp.id}
              type="button"
              disabled={disabled && !onOpenProfile}
              onClick={(e) => {
                if (!onOpenProfile) return onSelect(emp.id)
                const r = e.currentTarget.getBoundingClientRect()
                onOpenProfile(emp.id, { x: r.left, y: r.top, width: r.width, height: r.height })
              }}
              aria-pressed={selected}
              title={disabled ? `${emp.name} no realiza este servicio` : undefined}
              className={cardClass(selected, disabled)}
            >
              {selected && <SelectedBadge />}
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-[color:var(--booking-avatar-bg)] text-3xl font-semibold text-[color:var(--booking-avatar-text)]">
                {emp.photoUrl ? (
                  <Image
                    src={emp.photoUrl}
                    alt=""
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  emp.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-[color:var(--booking-fg)]">{emp.name}</p>
                <p className="truncate text-xs text-[color:var(--booking-fg-muted)]">
                  {disabled ? 'No hace este servicio' : emp.bio?.trim() || 'Profesional'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
