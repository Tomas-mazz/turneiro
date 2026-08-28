import {
  LandingSection,
  LandingSectionHeader,
} from './LandingSection'

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
    <LandingSection id="como-funciona" tone="white">
      <LandingSectionHeader
        label="Cómo funciona"
        title="Tres pasos para empezar"
      />

      <ol className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {steps.map((item) => (
          <li key={item.step} className="landing-card">
            <span className="landing-step-num">{item.step}</span>
            <h3 className="mt-4 font-heading text-base font-semibold text-[var(--landing-ink)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </LandingSection>
  )
}
