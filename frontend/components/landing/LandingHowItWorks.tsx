const steps = [
  {
    step: '1',
    title: 'Solicitás acceso',
    description: 'Nos escribís y activamos tu cuenta con 1 mes de prueba gratis.',
  },
  {
    step: '2',
    title: 'Configurás tu negocio',
    description: 'Servicios, horarios, empleados y tu página de reservas.',
  },
  {
    step: '3',
    title: 'Compartís el link',
    description: 'Tus clientes empiezan a reservar online. Vos seguís la agenda.',
  },
]

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
          Cómo funciona
        </p>
        <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-3xl">
          Tres pasos para empezar
        </h2>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((item) => (
            <li key={item.step} className="relative">
              <span
                aria-hidden
                className="font-heading text-4xl font-semibold text-[var(--landing-accent)]/20 sm:text-5xl"
              >
                {item.step}
              </span>
              <h3 className="mt-2 font-heading text-base font-semibold text-[var(--landing-ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
