'use client'

import { useState } from 'react'
import { CONTACT_EMAIL } from './constants'
import {
  LandingSection,
  LandingSectionHeader,
} from './LandingSection'

const faqs = [
  {
    q: '¿Cómo empiezo?',
    a: `Escribinos a ${CONTACT_EMAIL} solicitando acceso. Activamos tu cuenta y tenés 1 mes de prueba gratis.`,
  },
  {
    q: '¿Qué incluye el mes gratis?',
    a: 'Acceso completo al plan estándar durante 30 días para configurar tu negocio y probar el flujo con clientes reales.',
  },
  {
    q: '¿Mis clientes necesitan una app?',
    a: 'No. Reservan desde el navegador del celular o la computadora, con el link de tu negocio.',
  },
  {
    q: '¿Puedo cobrar seña?',
    a: 'Sí. Podés configurar pagos con Mercado Pago según cómo quieras trabajar (seña o total).',
  },
  {
    q: '¿Cuántos empleados puedo tener?',
    a: 'El plan estándar incluye hasta 3 empleados. El Plan Pro (próximamente) va a sumar más capacidad.',
  },
]

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <LandingSection id="faq" tone="muted">
      <LandingSectionHeader
        label="FAQ"
        title="Preguntas frecuentes"
      />

      <ul className="mt-10 space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i
          return (
            <li key={item.q} className="landing-card !p-0 hover:!transform-none">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="font-heading text-sm font-semibold text-[var(--landing-ink)] sm:text-base">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isOpen
                      ? 'bg-[var(--landing-accent)] text-white'
                      : 'bg-[var(--landing-soft)] text-[var(--landing-accent)]'
                  }`}
                >
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <p className="border-t border-[var(--landing-border)] px-5 pb-4 pt-3 text-sm leading-relaxed text-[var(--landing-muted)] sm:px-6">
                  {item.a}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </LandingSection>
  )
}
