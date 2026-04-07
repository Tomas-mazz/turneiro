'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { ResolvedSidebarMenu } from './types'
import { SidebarItem } from './SidebarItem'
import { SidebarSection } from './SidebarSection'
import { findSectionIdForPath } from './utils'
import { panel } from '@/lib/panelTheme'

export type AppSidebarProps = {
  menu: ResolvedSidebarMenu
  pathname: string
  onNavigate: (href: string) => void
  /** localStorage key for which accordion section is open */
  storageKey?: string
  railStorageKey?: string
  /** Header block above nav (e.g. business title) */
  header?: React.ReactNode
  /** Footer inside scroll area or below */
  footer?: React.ReactNode
  className?: string
  /** Force expanded layout (e.g. mobile drawer) */
  forceExpanded?: boolean
  /** Hide icon-only rail toggle (e.g. admin+shop hybrid — narrow rail breaks admin labels) */
  disableRailCollapse?: boolean
}

export function AppSidebar({
  menu,
  pathname,
  onNavigate,
  storageKey = 'turneiro-sidebar-section',
  railStorageKey = 'turneiro-sidebar-rail',
  header,
  footer,
  className = '',
  forceExpanded = false,
  disableRailCollapse = false,
}: AppSidebarProps) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)
  const [railCollapsed, setRailCollapsed] = useState(false)

  const collapsed = forceExpanded || disableRailCollapse ? false : railCollapsed

  useEffect(() => {
    if (forceExpanded || disableRailCollapse) return
    try {
      if (localStorage.getItem(railStorageKey) === '1') setRailCollapsed(true)
    } catch {
      /* ignore */
    }
  }, [railStorageKey, forceExpanded, disableRailCollapse])

  useEffect(() => {
    if (forceExpanded || disableRailCollapse) return
    try {
      localStorage.setItem(railStorageKey, railCollapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [railCollapsed, railStorageKey, forceExpanded, disableRailCollapse])

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

  const widthCls = collapsed ? 'w-[4.5rem]' : 'w-full min-w-0'

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${widthCls} transition-[width] duration-300 ease-out ${className}`}
    >
      {header && (
        <div className={`mb-3 shrink-0 ${collapsed ? 'hidden' : ''}`}>{header}</div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 thin-scrollbar">
        <div className={`flex flex-col ${collapsed ? 'gap-2' : 'gap-2'}`}>
          {menu.standalone.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              path={item.path}
              pathname={pathname}
              Icon={item.Icon}
              variant={item.variant}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          ))}

          {!collapsed &&
            menu.sections.map((section) => (
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

          {collapsed &&
            menu.sections.map((section) => (
              <SidebarSection
                key={section.id}
                id={section.id}
                title={section.title}
                Icon={section.Icon}
                tone={section.tone}
                items={section.items}
                open={false}
                onToggle={() => {}}
                pathname={pathname}
                onNavigate={handleNavigate}
                collapsed
              />
            ))}
        </div>
      </div>

      {footer && <div className={`mt-3 shrink-0 ${collapsed ? 'hidden' : ''}`}>{footer}</div>}

      {!forceExpanded && !disableRailCollapse && (
        <div className={`mt-2 shrink-0 border-t ${panel.navBorder} pt-2`}>
          <button
            type="button"
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            onClick={() => setRailCollapsed((v) => !v)}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-neutral-800 hover:text-white ${collapsed ? '' : 'justify-between px-3'}`}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" aria-hidden />
            ) : (
              <>
                <span className="text-[0.7rem] uppercase tracking-wide">Ancho</span>
                <ChevronsLeft className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
