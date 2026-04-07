'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import type { ResolvedMenuItem } from './types'
import { SidebarItem } from './SidebarItem'

type SidebarSectionProps = {
  id: string
  title: string
  Icon: LucideIcon
  tone: 'default' | 'danger'
  items: ResolvedMenuItem[]
  open: boolean
  onToggle: () => void
  pathname: string
  onNavigate: (path: string) => void
  collapsed?: boolean
}

export function SidebarSection({
  title,
  Icon,
  tone,
  items,
  open,
  onToggle,
  pathname,
  onNavigate,
  collapsed = false,
}: SidebarSectionProps) {
  const dangerZone = tone === 'danger'

  if (collapsed) {
    return (
      <div
        className={`space-y-1 rounded-lg border p-1 ${
          dangerZone ? 'border-red-900/50 bg-red-950/15' : 'border-neutral-800/80 bg-neutral-900/40'
        }`}
      >
        <div
          className={`flex items-center justify-center gap-2 px-1 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
            dangerZone ? 'text-red-300/90' : 'text-white/50'
          }`}
          title={title}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            path={item.path}
            pathname={pathname}
            Icon={item.Icon}
            variant={item.variant}
            collapsed
            onNavigate={onNavigate}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        dangerZone ? 'border-red-900/45 bg-red-950/20' : 'border-neutral-800 bg-neutral-900/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
          dangerZone
            ? 'text-red-200/90 hover:bg-red-950/30'
            : 'text-white/75 hover:bg-neutral-800/80'
        }`}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-neutral-800/80"
          >
            <div className="space-y-0.5 p-1.5">
              {items.map((item) => (
                <SidebarItem
                  key={item.id}
                  label={item.label}
                  path={item.path}
                  pathname={pathname}
                  Icon={item.Icon}
                  variant={item.variant}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
