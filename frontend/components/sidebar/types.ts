import type { LucideIcon } from 'lucide-react'

/** Keys mapped to lucide icons in iconMap */
export type SidebarIconKey =
  | 'home'
  | 'user'
  | 'briefcase'
  | 'clock'
  | 'calendarOff'
  | 'wallet'
  | 'palette'
  | 'image'
  | 'alertOctagon'
  | 'layoutDashboard'
  | 'building2'
  | 'calendar'
  | 'plusCircle'

export type ItemVariant = 'default' | 'danger'

export type SidebarMenuItemDef = {
  id: string
  label: string
  path: string
  icon: SidebarIconKey
  variant?: ItemVariant
  /** If set, item is only shown for these roles */
  roles?: Array<'OWNER' | 'STAFF' | 'ADMIN' | 'SELLER'>
}

export type SidebarMenuSectionDef = {
  id: string
  title: string
  icon: SidebarIconKey
  /** Visual treatment for "Acciones" / danger zone */
  tone?: 'default' | 'danger'
  items: SidebarMenuItemDef[]
  /** Section is omitted if no items remain after role filter */
  roles?: Array<'OWNER' | 'STAFF' | 'ADMIN' | 'SELLER'>
}

export type SidebarMenuStandaloneDef = {
  id: string
  label: string
  path: string
  icon: SidebarIconKey
  roles?: Array<'OWNER' | 'STAFF' | 'ADMIN' | 'SELLER'>
}

export type SidebarMenuDefinition = {
  standalone: SidebarMenuStandaloneDef[]
  sections: SidebarMenuSectionDef[]
}

export type ResolvedMenuItem = {
  id: string
  label: string
  path: string
  Icon: LucideIcon
  variant: ItemVariant
}

export type ResolvedMenuSection = {
  id: string
  title: string
  Icon: LucideIcon
  tone: 'default' | 'danger'
  items: ResolvedMenuItem[]
}

export type ResolvedSidebarMenu = {
  standalone: ResolvedMenuItem[]
  sections: ResolvedMenuSection[]
}

export type ShopRole = 'OWNER' | 'STAFF'
