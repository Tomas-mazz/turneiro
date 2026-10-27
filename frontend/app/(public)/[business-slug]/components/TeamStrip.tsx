'use client'

import Image from 'next/image'
import { Check, Info } from 'lucide-react'
import type { Employee } from '../types'

type TeamStripProps = {
  employees: Employee[]
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
  /** "Ver perfil" opens the professional's profile, flying out of the card's position. */
  onOpenProfile: (employeeId: string, origin: { x: number; y: number; width: number; height: number }) => void
  /** Section heading, numbered by the page (the team is the first step). */
  title: string
}

const cardBase =
  'group relative flex w-[112px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-[color:var(--booking-card-bg)] shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:scale-[1.04] hover:shadow-xl motion-reduce:transform-none md:w-[128px]'

/** Team picker: the client must choose who does the job before anything else. */
export function TeamStrip({ employees, selectedEmployeeId, onSelect, onOpenProfile, title }: TeamStripProps) {
  if (employees.length < 2) return null

  return (
    <section id="booking-team" className="scroll-mt-4" aria-labelledby="team-title">
      <h2 id="team-title" className="mb-3 text-lg font-semibold text-[color:var(--booking-fg)] md:text-center md:text-xl">
        {title}
      </h2>
      <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 pt-2 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
        {employees.map((emp) => {
          const selected = selectedEmployeeId === emp.id
          return (
            <div
              key={emp.id}
              className={`${cardBase} ${
                selected
                  ? 'border-[color:var(--booking-fg)] ring-1 ring-[color:var(--booking-fg)]'
                  : 'border-[color:var(--booking-card-border)] hover:border-[color:var(--booking-border)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(emp.id)}
                aria-pressed={selected}
                className="flex flex-col text-left"
              >
                {selected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--booking-fg)] text-[color:var(--booking-page-bg)]">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-[color:var(--booking-avatar-bg)] text-3xl font-semibold text-[color:var(--booking-avatar-text)]">
                  {emp.photoUrl ? (
                    <Image
                      src={emp.photoUrl}
                      alt=""
                      width={128}
                      height={128}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transform-none"
                      unoptimized
                    />
                  ) : (
                    <span className="transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transform-none">
                      {emp.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="px-3 pb-1 pt-2">
                  <p className="truncate text-sm font-semibold text-[color:var(--booking-fg)]">{emp.name}</p>
                  <p className="truncate text-xs text-[color:var(--booking-fg-muted)]">
                    {emp.bio?.trim() || 'Profesional'}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const r = (e.currentTarget.parentElement ?? e.currentTarget).getBoundingClientRect()
                  onOpenProfile(emp.id, { x: r.left, y: r.top, width: r.width, height: r.height })
                }}
                className="mx-2 mb-2 mt-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-[color:var(--booking-fg-muted)] transition-colors hover:bg-[color:var(--booking-control-hover)] hover:text-[color:var(--booking-fg)]"
                aria-label={`Ver perfil de ${emp.name}`}
              >
                <Info className="h-3.5 w-3.5" aria-hidden />
                Ver perfil
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
