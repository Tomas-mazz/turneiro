'use client'

import { useState } from 'react'
import { ACCESS_MAILTO } from './constants'
import {
  LandingSection,
  LandingSectionHeader,
} from './LandingSection'

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
    <LandingSection id="precios" tone="default" className="scroll-mt-20">
      <LandingSectionHeader
        label="Precios"
        title="Un plan claro, sin sorpresas"
        description="Empezá con 1 mes gratis. Después elegí mensual o anual."
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
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
          <span className="landing-badge">Ahorrás 20%</span>
        )}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="landing-card !border-[var(--landing-accent)] hover:!transform-none">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold text-[var(--landing-ink)]">
              Plan estándar
            </h3>
            <span className="landing-badge">Disponible</span>
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
                <span
                  aria-hidden
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--landing-soft)] text-xs font-bold text-[var(--landing-accent)]"
                >
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

        <div className="landing-card !border-dashed !bg-transparent opacity-75 hover:!transform-none hover:!shadow-none">
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
            Más empleados, multi-negocios y extras avanzados. Te avisamos cuando esté
            disponible.
          </p>
        </div>
      </div>
    </LandingSection>
  )
}
