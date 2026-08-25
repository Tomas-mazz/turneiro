import { DEMO_URL } from './constants'

export function LandingDemo() {
  return (
    <section id="demo" className="px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="mx-auto max-w-5xl">
        <a
          href={DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-white transition-colors hover:border-[var(--landing-accent)]"
        >
          <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-lg">
              <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
                Probalo
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-2xl">
                Mirá cómo reserva un cliente
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
                Abrí la demo en vivo y recorré el flujo de reserva como lo verían
                tus clientes.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-[var(--landing-soft)] px-4 py-2.5 text-sm font-medium text-[var(--landing-accent)] transition-colors group-hover:bg-[var(--landing-accent)] group-hover:text-white sm:self-center">
              Ir a la demo
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </div>
          <div
            aria-hidden
            className="h-1.5 w-full bg-gradient-to-r from-[var(--landing-accent)] via-[var(--landing-accent-hover)] to-transparent opacity-80"
          />
        </a>
      </div>
    </section>
  )
}
