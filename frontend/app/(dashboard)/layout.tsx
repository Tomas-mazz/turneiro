'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import {
  isAuthenticated,
  getAuthUser,
  getAdminActingShopSlug,
  clearAdminActingShopSlug,
} from '@/lib/auth'
import { getMyBusiness } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { BusinessLogoProvider } from '@/lib/businessLogoContext'
import { panel } from '@/lib/panelTheme'
import {
  AppSidebar,
  MobileSidebarDrawer,
  resolveAdminPlatformMenu,
  resolveShopMenu,
} from '@/components/sidebar'

type DashboardRole = 'OWNER' | 'STAFF' | 'ADMIN_HYBRID' | null

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DashboardRole>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isAdminHybrid = role === 'ADMIN_HYBRID'

  useEffect(() => {
    const user = getAuthUser()
    const acting = getAdminActingShopSlug()
    if (user?.role === 'ADMIN' && acting) {
      setRole('ADMIN_HYBRID')
    } else if (user?.role === 'OWNER' || user?.role === 'STAFF') {
      setRole(user.role)
    } else {
      setRole(null)
    }
  }, [])

  useEffect(() => {
    getMyBusiness()
      .then((b) => {
        setBusinessName(b.name)
        setBusinessSlug(b.slug)
        setBusinessLogo(b.logo)
      })
      .catch(() => {
        setBusinessName(null)
        setBusinessSlug(null)
        setBusinessLogo(null)
      })
  }, [])

  const effectivePath = pathname || '/setting'

  const shopRole = isAdminHybrid ? 'ADMIN' : role === 'STAFF' ? 'STAFF' : 'OWNER'
  const shopMenu = resolveShopMenu(shopRole)
  const adminMenu = resolveAdminPlatformMenu()

  /** Same host so localStorage session stays valid (not shared across subdomains). */
  const handleAdminOnlyClick = () => {
    clearAdminActingShopSlug()
    router.push('/admin')
  }

  return (
    <div className={`flex h-screen ${panel.contentBg}`}>
      <aside className={`hidden w-72 shrink-0 flex-col ${panel.sidebarBg} text-white md:flex`}>
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5">
          {isAdminHybrid && (
            <>
              <AppSidebar
                menu={adminMenu}
                pathname={effectivePath}
                onNavigate={(href) => router.push(href)}
                storageKey="turneiro-sidebar-admin-open"
                header={
                  <div className={`border-b ${panel.navBorder} pb-3`}>
                    <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                      Turneiro (admin)
                    </p>
                    <p className="mt-1 text-xs text-white/90">Panel global</p>
                  </div>
                }
                footer={
                  <button type="button" onClick={handleAdminOnlyClick} className={panel.outlineBtn}>
                    Ir solo a admin (sin tienda)
                  </button>
                }
              />
              <div className={`my-2 border-t ${panel.navBorder}`} role="separator" />
            </>
          )}

          <AppSidebar
            menu={shopMenu}
            pathname={effectivePath}
            onNavigate={(href) => router.push(href)}
            storageKey="turneiro-sidebar-shop-open"
            header={
              <div className={`border-b ${panel.navBorder} pb-4`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                  {isAdminHybrid ? 'Vista de la tienda' : 'Tu negocio'}
                </p>
                <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                  {businessName ?? 'Configuración'}
                </p>
              </div>
            }
            footer={
              businessSlug ? (
                <Link
                  href="/"
                  onClick={(event) => event.stopPropagation()}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
                >
                  <span aria-hidden>←</span>
                  Volver a la página principal
                </Link>
              ) : null
            }
          />
        </div>
      </aside>

      <div className="relative flex h-full flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          <BusinessLogoProvider value={businessLogo}>
            {children}
          </BusinessLogoProvider>
        </div>

        <nav
          className={`fixed inset-x-0 bottom-0 z-20 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur md:hidden ${panel.mobileBar}`}
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
            >
              <Menu className="h-4 w-4" aria-hidden />
              <span className="truncate">Menú</span>
            </button>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
            >
              Inicio
            </Link>
          </div>
        </nav>

        <MobileSidebarDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Navegación"
        >
          <div className="space-y-4">
            {isAdminHybrid && (
              <AppSidebar
                menu={adminMenu}
                pathname={effectivePath}
                onNavigate={(href) => {
                  setMobileOpen(false)
                  router.push(href)
                }}
                forceExpanded
                header={
                  <div className={`border-b ${panel.navBorder} pb-3`}>
                    <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                      Turneiro (admin)
                    </p>
                    <p className="mt-1 text-xs text-white/90">Panel global</p>
                  </div>
                }
                footer={
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      handleAdminOnlyClick()
                    }}
                    className={panel.outlineBtn}
                  >
                    Ir solo a admin (sin tienda)
                  </button>
                }
              />
            )}

            <AppSidebar
              menu={shopMenu}
              pathname={effectivePath}
              onNavigate={(href) => {
                setMobileOpen(false)
                router.push(href)
              }}
              forceExpanded
              header={
                <div className={`border-b ${panel.navBorder} pb-4`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                    {isAdminHybrid ? 'Vista de la tienda' : 'Tu negocio'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                    {businessName ?? 'Configuración'}
                  </p>
                </div>
              }
              footer={
                businessSlug ? (
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
                  >
                    <span aria-hidden>←</span>
                    Volver a la página principal
                  </Link>
                ) : null
              }
            />
          </div>
        </MobileSidebarDrawer>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const user = getAuthUser()
    if (user?.role === 'SELLER') {
      router.replace('/seller')
      return
    }
    if (user?.role === 'ADMIN' && !getAdminActingShopSlug()) {
      router.replace('/admin')
      return
    }
    if (user?.role === 'ADMIN' && getAdminActingShopSlug()) {
      setAllowed(true)
      return
    }
    if (user?.role === 'ADMIN') {
      router.replace('/admin')
      return
    }
    setAllowed(true)
  }, [router])

  if (allowed === null) {
    return <LoadingSpinner bgColor="bg-neutral-100" />
  }

  if (!allowed) {
    return null
  }

  return <DashboardShell>{children}</DashboardShell>
}
