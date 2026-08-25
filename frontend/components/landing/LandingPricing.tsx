'use client'

import { useState } from 'react'
import { ACCESS_MAILTO } from './constants'

const planFeatures = [
  'Página de reservas online',
  'Sincronización con Google Calendar',
  'Pagos con Mercado Pago',
  'Hasta 3 empleados',
  '1 mes de prueba gratis',
]

export function LandingPricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="precios" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
          Precios
        </p>
        <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-3xl">
          Un plan claro, sin sorpresas
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--landing-muted)]">
          Empezá con 1 mes gratis. Después elegí mensual o anual.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <span
            className={`text-sm ${!annual ? 'font-medium text-[var(--landing-ink)]' : 'text-[var(--landing-muted)]'}`}
          >
            Mensual
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Facturación anual"
            onClick={() => setAnnual((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? 'bg-[var(--landing-accent)]' : 'bg-[var(--landing-border)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                annual ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-sm ${annual ? 'font-medium text-[var(--landing-ink)]' : 'text-[var(--landing-muted)]'}`}
          >
            Anual
          </span>
          {annual && (
            <span className="rounded-md bg-[var(--landing-soft)] px-2 py-0.5 text-xs font-medium text-[var(--landing-accent)]">
              Ahorrás 20%
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--landing-accent)] bg-white p-7 sm:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold text-[var(--landing-ink)]">
                Plan estándar
              </h3>
              <span className="rounded-md bg-[var(--landing-soft)] px-2 py-0.5 text-xs font-medium text-[var(--landing-accent)]">
                Disponible
              </span>
            </div>

            <div className="mt-5">
              {annual ? (
                <>
                  <p className="font-heading text-4xl font-semibold tracking-tight text-[var(--landing-ink)]">
                    $24.000
                    <span className="text-base font-normal text-[var(--landing-muted)]">
                      /mes
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--landing-muted)]">
                    Facturado $288.000 al año · Ahorrás $72.000
                  </p>
                </>
              ) : (
                <>
                  <p className="font-heading text-4xl font-semibold tracking-tight text-[var(--landing-ink)]">
                    $30.000
                    <span className="text-base font-normal text-[var(--landing-muted)]">
                      /mes
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--landing-muted)]">
                    Facturación mensual
                  </p>
                </>
              )}
            </div>

            <ul className="mt-6 space-y-2.5">
              {planFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-[var(--landing-muted)]"
                >
                  <span aria-hidden className="mt-0.5 text-[var(--landing-accent)]">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <a href={ACCESS_MAILTO} className="landing-btn-primary mt-8 w-full sm:w-auto">
              Solicitar acceso
            </a>
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--landing-border)] bg-transparent p-7 opacity-70 sm:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold text-[var(--landing-muted)]">
                Plan Pro
              </h3>
              <span className="rounded-md border border-[var(--landing-border)] px-2 py-0.5 text-xs font-medium text-[var(--landing-muted)]">
                Próximamente
              </span>
            </div>
            <p className="mt-5 font-heading text-3xl font-semibold text-[var(--landing-muted)]">
              —
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--landing-muted)]">
              Más empleados, multi-negocios y extras avanzados. Te avisamos cuando
              esté disponible.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
