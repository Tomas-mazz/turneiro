import type { ReactNode } from 'react'
import {
  LandingSection,
  LandingSectionHeader,
} from './LandingSection'
import {
  IconBrand,
  IconCalendar,
  IconDevice,
  IconPayment,
} from './LandingIcons'

const features: {
  title: string
  description: string
  icon: ReactNode
}[] = [
  {
    title: 'Página de reservas',
    description:
      'Tus clientes eligen servicio, día y hora desde el celular, sin instalar nada.',
    icon: <IconDevice />,
  },
  {
    title: 'Google Calendar',
    description:
      'Los turnos se sincronizan con tu agenda. Menos dobles reservas, más control.',
    icon: <IconCalendar />,
  },
  {
    title: 'Pagos online',
    description:
      'Cobrá seña o el total con Mercado Pago, según cómo quieras trabajar.',
    icon: <IconPayment />,
  },
  {
    title: 'Tu marca',
    description:
      'Página propia con el look de tu negocio: colores, fotos y link para compartir.',
    icon: <IconBrand />,
  },
]

export function LandingProduct() {
  return (
    <LandingSection id="producto" tone="white">
      <LandingSectionHeader
        label="El producto"
        title="Todo lo que necesitás para tomar turnos online"
        description="Turneiro te da una página de reservas lista para compartir, un panel para gestionar servicios y horarios, y sincronización con Google Calendar."
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {features.map((item) => (
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
