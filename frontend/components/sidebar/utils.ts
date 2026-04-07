import type { ResolvedSidebarMenu } from './types'

/**
 * Active state for dashboard /setting and /admin routes.
 */
export function isSidebarPathActive(pathname: string, href: string): boolean {
  const p = pathname || ''
  if (href === '/setting' || href === '/setting/') {
    return p === '/setting' || p === '/setting/'
  }
  if (href === '/admin' || href === '/admin/') {
    return p === '/admin' || p === '/admin/'
  }
  if (href.startsWith('/admin/businesses/new')) {
    return p.startsWith('/admin/businesses/new')
  }
  if (href === '/admin/businesses' || href.startsWith('/admin/businesses?')) {
    return p.startsWith('/admin/businesses') && !p.startsWith('/admin/businesses/new')
  }
  return p === href || p.startsWith(`${href}/`)
}

export function findSectionIdForPath(
  pathname: string,
  menu: ResolvedSidebarMenu
): string | null {
  for (const s of menu.standalone) {
    if (isSidebarPathActive(pathname, s.path)) return '__standalone__'
  }
  for (const sec of menu.sections) {
    for (const it of sec.items) {
      if (isSidebarPathActive(pathname, it.path)) return sec.id
    }
  }
  return null
}
