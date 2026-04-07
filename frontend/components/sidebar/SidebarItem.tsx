'use client'

import type { LucideIcon } from 'lucide-react'
import { isSidebarPathActive } from './utils'

type SidebarItemProps = {
  label: string
  path: string
  pathname: string
  Icon: LucideIcon
  variant?: 'default' | 'danger'
  collapsed?: boolean
  onNavigate: (path: string) => void
}

export function SidebarItem({
  label,
  path,
  pathname,
  Icon,
  variant = 'default',
  collapsed = false,
  onNavigate,
}: SidebarItemProps) {
  const active = isSidebarPathActive(pathname, path)
  const isDanger = variant === 'danger'

  const base =
    'flex w-full items-center gap-3 rounded-lg border-l-2 text-left text-sm font-medium transition-colors duration-200'
  const padding = collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
  const activeStyles = active
    ? isDanger
      ? 'border-red-400 bg-red-900/40 text-red-50'
      : 'border-white bg-neutral-700 text-white'
    : isDanger
      ? 'border-transparent text-red-300/90 hover:bg-red-950/35 hover:text-red-100'
      : 'border-transparent text-white hover:bg-neutral-800'

  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      onClick={() => onNavigate(path)}
      className={`${base} ${padding} ${activeStyles}`}
    >
      <Icon
        className={`h-[1.125rem] w-[1.125rem] shrink-0 ${isDanger && !active ? 'text-red-400' : ''}`}
        aria-hidden
      />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
    </button>
  )
}
