import type { ReactNode } from 'react'

type SectionTone = 'default' | 'white' | 'soft' | 'muted'

const toneClass: Record<SectionTone, string> = {
  default: 'landing-section',
  white: 'landing-section landing-section--white',
  soft: 'landing-section landing-section--soft',
  muted: 'landing-section landing-section--muted',
}

export function LandingSectionHeader({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description?: string
}) {
  return (
    <div className="max-w-2xl">
      <span className="landing-label">{label}</span>
      <h2 className="mt-4 font-heading text-3xl text-[var(--landing-ink)] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-[var(--landing-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function LandingSection({
  id,
  tone = 'default',
  className = '',
  children,
}: {
  id?: string
  tone?: SectionTone
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`${toneClass[tone]} ${className}`.trim()}>
      <div className="landing-section-inner">{children}</div>
    </section>
  )
}
