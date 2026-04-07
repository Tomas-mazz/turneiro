'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ResolvedSidebarMenu } from './types'
import { SidebarItem } from './SidebarItem'
import { SidebarSection } from './SidebarSection'
import { findSectionIdForPath } from './utils'

export type AppSidebarProps = {
  menu: ResolvedSidebarMenu
  pathname: string
  onNavigate: (href: string) => void
  /** localStorage key for which accordion section is open */
  storageKey?: string
  /** Header block above nav (e.g. business title) */
  header?: React.ReactNode
  /** Footer inside scroll area or below */
  footer?: React.ReactNode
  className?: string
  /** Force expanded layout (e.g. mobile drawer) */
  forceExpanded?: boolean
}

export function AppSidebar({
  menu,
  pathname,
  onNavigate,
  storageKey = 'turneiro-sidebar-section',
  header,
  footer,
  className = '',
  forceExpanded = false,
}: AppSidebarProps) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)

  const syncSectionFromRoute = useCallback(() => {
    const sid = findSectionIdForPath(pathname, menu)
    if (sid && sid !== '__standalone__') {
      setOpenSectionId(sid)
      return true
    }
    return false
  }, [pathname, menu])

  useEffect(() => {
    if (syncSectionFromRoute()) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved && menu.sections.some((s) => s.id === saved)) {
        setOpenSectionId(saved)
        return
      }
    } catch {
      /* ignore */
    }
    if (menu.sections[0]) setOpenSectionId(menu.sections[0].id)
  }, [pathname, menu, storageKey, syncSectionFromRoute])

  useEffect(() => {
    try {
      if (openSectionId) localStorage.setItem(storageKey, openSectionId)
    } catch {
      /* ignore */
    }
  }, [openSectionId, storageKey])

  const toggleSection = (id: string) => {
    setOpenSectionId((prev) => (prev === id ? null : id))
  }

  const handleNavigate = (href: string) => {
    onNavigate(href)
  }

  return (
    <div
      className={`flex w-full min-w-0 min-h-0 flex-1 flex-col ${className}`}
    >
      {header && <div className="mb-3 shrink-0">{header}</div>}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 thin-scrollbar">
        <div className="flex flex-col gap-2">
          {menu.standalone.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              path={item.path}
              pathname={pathname}
              Icon={item.Icon}
              variant={item.variant}
              onNavigate={handleNavigate}
            />
          ))}

          {menu.sections.map((section) => (
            <SidebarSection
              key={section.id}
              id={section.id}
              title={section.title}
              Icon={section.Icon}
              tone={section.tone}
              items={section.items}
              open={openSectionId === section.id}
              onToggle={() => toggleSection(section.id)}
              pathname={pathname}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </div>

      {footer && <div className="mt-3 shrink-0">{footer}</div>}
    </div>
  )
}
