import { getSidebarIcon } from './iconMap'
import type {
  ResolvedMenuItem,
  ResolvedMenuSection,
  ResolvedSidebarMenu,
  ShopRole,
  SidebarMenuDefinition,
  SidebarMenuItemDef,
  SidebarMenuSectionDef,
  SidebarMenuStandaloneDef,
} from './types'

/** Full shop menu (owner) — filtered by role */
export const SHOP_MENU_DEF: SidebarMenuDefinition = {
  standalone: [
    {
      id: 'home',
      label: 'Inicio',
      path: '/setting',
      icon: 'home',
      roles: ['OWNER', 'STAFF', 'ADMIN'],
    },
  ],
  sections: [
    {
      id: 'account',
      title: 'Cuenta',
      icon: 'user',
      roles: ['OWNER', 'STAFF', 'ADMIN'],
      items: [
        {
          id: 'profile',
          label: 'Mi perfil',
          path: '/setting/profile',
          icon: 'user',
          roles: ['OWNER', 'STAFF', 'ADMIN'],
        },
      ],
    },
    {
      id: 'business',
      title: 'Negocio',
      icon: 'briefcase',
      roles: ['OWNER', 'STAFF', 'ADMIN'],
      items: [
        {
          id: 'services',
          label: 'Servicios',
          path: '/setting/services',
          icon: 'briefcase',
          roles: ['OWNER', 'ADMIN'],
        },
        {
          id: 'hours',
          label: 'Horarios',
          path: '/setting/hours',
          icon: 'clock',
          roles: ['OWNER', 'ADMIN'],
        },
        {
          id: 'block',
          label: 'Bloquear días y horarios',
          path: '/setting/blocking',
          icon: 'calendarOff',
          roles: ['OWNER', 'STAFF', 'ADMIN'],
        },
      ],
    },
    {
      id: 'finance',
      title: 'Finanzas',
      icon: 'wallet',
      roles: ['OWNER', 'ADMIN'],
      items: [
        {
          id: 'payments',
          label: 'Pagos',
          path: '/setting/payments',
          icon: 'wallet',
          roles: ['OWNER', 'ADMIN'],
        },
      ],
    },
    {
      id: 'customization',
      title: 'Personalización',
      icon: 'palette',
      roles: ['OWNER', 'ADMIN'],
      items: [
        {
          id: 'appearance',
          label: 'Fuentes y Colores',
          path: '/setting/appearance',
          icon: 'palette',
          roles: ['OWNER', 'ADMIN'],
        },
        {
          id: 'images',
          label: 'Imágenes',
          path: '/setting/images',
          icon: 'image',
          roles: ['OWNER', 'ADMIN'],
        },
      ],
    },
    {
      id: 'actions',
      title: 'Acciones',
      icon: 'alertOctagon',
      tone: 'danger',
      roles: ['OWNER', 'STAFF', 'ADMIN'],
      items: [
        {
          id: 'cancel',
          label: 'Cancelar turnos',
          path: '/setting/cancel',
          icon: 'alertOctagon',
          variant: 'danger',
          roles: ['OWNER', 'STAFF', 'ADMIN'],
        },
      ],
    },
  ],
}

/** Admin platform (/admin) — all roles here are ADMIN */
export const ADMIN_PLATFORM_DEF: SidebarMenuDefinition = {
  standalone: [
    {
      id: 'admin-home',
      label: 'Inicio',
      path: '/admin',
      icon: 'home',
      roles: ['ADMIN'],
    },
  ],
  sections: [
    {
      id: 'platform',
      title: 'Plataforma',
      icon: 'layoutDashboard',
      roles: ['ADMIN'],
      items: [
        {
          id: 'businesses',
          label: 'Negocios',
          path: '/admin/businesses',
          icon: 'building2',
          roles: ['ADMIN'],
        },
        {
          id: 'sellers',
          label: 'Vendedores',
          path: '/admin/sellers',
          icon: 'user',
          roles: ['ADMIN'],
        },
        {
          id: 'appointments',
          label: 'Citas',
          path: '/admin/appointments',
          icon: 'calendar',
          roles: ['ADMIN'],
        },
        {
          id: 'new-business',
          label: 'Crear negocio',
          path: '/admin/businesses/new',
          icon: 'plusCircle',
          roles: ['ADMIN'],
        },
      ],
    },
  ],
}

/** Seller platform (/seller) — all roles here are SELLER */
export const SELLER_PLATFORM_DEF: SidebarMenuDefinition = {
  standalone: [
    {
      id: 'seller-home',
      label: 'Inicio',
      path: '/seller',
      icon: 'home',
      roles: ['SELLER'],
    },
  ],
  sections: [
    {
      id: 'seller-business',
      title: 'Negocios',
      icon: 'building2',
      roles: ['SELLER'],
      items: [
        {
          id: 'seller-businesses',
          label: 'Mis negocios',
          path: '/seller/businesses',
          icon: 'building2',
          roles: ['SELLER'],
        },
        {
          id: 'seller-new-business',
          label: 'Crear negocio',
          path: '/seller/businesses/new',
          icon: 'plusCircle',
          roles: ['SELLER'],
        },
      ],
    },
  ],
}

function roleMatches(
  def: { roles?: Array<'OWNER' | 'STAFF' | 'ADMIN' | 'SELLER'> },
  role: ShopRole | 'ADMIN' | 'SELLER'
): boolean {
  if (!def.roles?.length) return true
  return def.roles.includes(role)
}

function resolveItem(item: SidebarMenuItemDef, role: ShopRole | 'ADMIN' | 'SELLER'): ResolvedMenuItem | null {
  if (!roleMatches(item, role)) return null
  return {
    id: item.id,
    label: item.label,
    path: item.path,
    Icon: getSidebarIcon(item.icon),
    variant: item.variant ?? 'default',
  }
}

function resolveSection(
  section: SidebarMenuSectionDef,
  role: ShopRole | 'ADMIN' | 'SELLER'
): ResolvedMenuSection | null {
  if (!roleMatches(section, role)) return null
  const items: ResolvedMenuItem[] = []
  for (const it of section.items) {
    const r = resolveItem(it, role)
    if (r) items.push(r)
  }
  if (items.length === 0) return null
  return {
    id: section.id,
    title: section.title,
    Icon: getSidebarIcon(section.icon),
    tone: section.tone ?? 'default',
    items,
  }
}

function resolveDefinition(
  def: SidebarMenuDefinition,
  role: ShopRole | 'ADMIN' | 'SELLER'
): ResolvedSidebarMenu {
  const standalone: ResolvedMenuItem[] = []
  for (const s of def.standalone) {
    if (!roleMatches(s, role)) continue
    standalone.push({
      id: s.id,
      label: s.label,
      path: s.path,
      Icon: getSidebarIcon(s.icon),
      variant: 'default',
    })
  }
  const sections: ResolvedMenuSection[] = []
  for (const sec of def.sections) {
    const r = resolveSection(sec, role)
    if (r) sections.push(r)
  }
  return { standalone, sections }
}

export function resolveShopMenu(role: ShopRole | 'ADMIN'): ResolvedSidebarMenu {
  return resolveDefinition(SHOP_MENU_DEF, role)
}

export function resolveAdminPlatformMenu(): ResolvedSidebarMenu {
  return resolveDefinition(ADMIN_PLATFORM_DEF, 'ADMIN')
}

export function resolveSellerPlatformMenu(): ResolvedSidebarMenu {
  return resolveDefinition(SELLER_PLATFORM_DEF, 'SELLER')
}

export function flattenResolvedMenu(menu: ResolvedSidebarMenu): ResolvedMenuItem[] {
  return [...menu.standalone, ...menu.sections.flatMap((s) => s.items)]
}
