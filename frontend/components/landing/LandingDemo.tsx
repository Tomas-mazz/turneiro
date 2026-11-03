import { DEMO_URL } from './constants'
import { LandingSection } from './LandingSection'

export function LandingDemo() {
  return (
    <LandingSection id="demo" tone="soft" className="scroll-mt-20 !py-12 sm:!py-16">
      <a
        href={DEMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="landing-card group block overflow-hidden !p-0 hover:!transform-none"
      >
        <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-lg">
            <span className="landing-label">Probalo</span>
            <h2 className="mt-4 font-heading text-2xl text-[var(--landing-ink)] sm:text-3xl">
              Mirá cómo reserva un cliente
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
              Abrí la demo en vivo y recorré el flujo de reserva como lo verían tus
              clientes.
            </p>
          </div>
          <span className="landing-btn-primary shrink-0 gap-2 self-start text-sm sm:self-center">
            Ir a la demo
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
        <div
          aria-hidden
          className="h-2 w-full border-t-[2.5px] border-[var(--landing-ink)] bg-[var(--landing-yellow)]"
        />
      </a>
    </LandingSection>
  )
}
