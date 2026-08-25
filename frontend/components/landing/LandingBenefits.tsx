const benefits = [
  {
    title: 'Menos mensajes, más turnos',
    description:
      'Dejá de coordinar horarios por WhatsApp. Tus clientes reservan solos cuando les conviene.',
  },
  {
    title: 'Agenda siempre al día',
    description:
      'Con Google Calendar ves y gestionás los turnos donde ya trabajás todos los días.',
  },
  {
    title: 'Menos ausencias',
    description:
      'Con seña o pago online reducís cancelaciones de último momento.',
  },
  {
    title: 'Link listo para compartir',
    description:
      'Una URL propia para Instagram, WhatsApp o tu perfil. Sin app para el cliente.',
  },
]

export function LandingBenefits() {
  return (
    <section id="ventajas" className="border-y border-[var(--landing-border)] bg-white/50 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
          Ventajas
        </p>
        <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-3xl">
          Por qué negocios eligen Turneiro
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--landing-muted)]">
          Menos fricción para vos y para tus clientes. Más orden en la agenda.
        </p>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {benefits.map((item) => (
            <li key={item.title}>
              <h3 className="font-heading text-base font-semibold text-[var(--landing-ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)] sm:text-[0.95rem]">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
