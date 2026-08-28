import type { ReactNode } from 'react'
import {
  LandingSection,
  LandingSectionHeader,
} from './LandingSection'
import { IconCalendar, IconChat, IconLink, IconShield } from './LandingIcons'

const benefits: {
  title: string
  description: string
  icon: ReactNode
}[] = [
  {
    title: 'Menos mensajes, más turnos',
    description:
      'Dejá de coordinar horarios por WhatsApp. Tus clientes reservan solos cuando les conviene.',
    icon: <IconChat />,
  },
  {
    title: 'Agenda siempre al día',
    description:
      'Con Google Calendar ves y gestionás los turnos donde ya trabajás todos los días.',
    icon: <IconCalendar />,
  },
  {
    title: 'Menos ausencias',
    description:
      'Con seña o pago online reducís cancelaciones de último momento.',
    icon: <IconShield />,
  },
  {
    title: 'Link listo para compartir',
    description:
      'Una URL propia para Instagram, WhatsApp o tu perfil. Sin app para el cliente.',
    icon: <IconLink />,
  },
]

export function LandingBenefits() {
  return (
    <LandingSection id="ventajas" tone="soft">
      <LandingSectionHeader
        label="Ventajas"
        title="Por qué negocios eligen Turneiro"
        description="Menos fricción para vos y para tus clientes. Más orden en la agenda."
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {benefits.map((item) => (
          <li key={item.title} className="landing-card">
            <span className="landing-icon-wrap">{item.icon}</span>
            <h3 className="mt-4 font-heading text-base font-semibold text-[var(--landing-ink)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)] sm:text-[0.95rem]">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </LandingSection>
  )
}
