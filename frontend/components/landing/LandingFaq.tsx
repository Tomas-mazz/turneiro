'use client'

import { useState } from 'react'
import { CONTACT_EMAIL } from './constants'

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
    <section id="faq" className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
          FAQ
        </p>
        <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-3xl">
          Preguntas frecuentes
        </h2>

        <ul className="mt-10 divide-y divide-[var(--landing-border)] border-y border-[var(--landing-border)]">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <li key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-heading text-sm font-semibold text-[var(--landing-ink)] sm:text-base">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="text-lg text-[var(--landing-muted)]"
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-4 text-sm leading-relaxed text-[var(--landing-muted)]">
                    {item.a}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
