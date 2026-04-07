export { AppSidebar, type AppSidebarProps } from './AppSidebar'
export { MobileSidebarDrawer } from './MobileSidebarDrawer'
export { SidebarItem } from './SidebarItem'
export { SidebarSection } from './SidebarSection'
export {
  SHOP_MENU_DEF,
  ADMIN_PLATFORM_DEF,
  resolveShopMenu,
  resolveAdminPlatformMenu,
  flattenResolvedMenu,
} from './menuConfig'
export { getSidebarIcon } from './iconMap'
export { isSidebarPathActive, findSectionIdForPath } from './utils'
export type {
  SidebarMenuDefinition,
  ShopRole,
  ResolvedSidebarMenu,
  ResolvedMenuItem,
  ResolvedMenuSection,
} from './types'
