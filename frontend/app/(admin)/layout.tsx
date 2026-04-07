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
import { panel } from '@/lib/panelTheme'
import { AppSidebar, MobileSidebarDrawer, resolveAdminPlatformMenu, resolveShopMenu } from '@/components/sidebar'

function AdminShell({ children }: { children: React.ReactNode }) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [actingSlug, setActingSlug] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const hybrid = !!actingSlug

  useEffect(() => {
    const user = getAuthUser()
    if (user?.role === 'ADMIN') {
      setAdminEmail(user.email)
    } else {
      setAdminEmail(null)
    }
    setActingSlug(getAdminActingShopSlug())
  }, [pathname])

  useEffect(() => {
    if (!hybrid) return
    getMyBusiness()
      .then((b) => {
        setBusinessName(b.name)
        setBusinessSlug(b.slug)
      })
      .catch(() => {
        setBusinessName(null)
        setBusinessSlug(null)
      })
  }, [hybrid])

  const effectivePath = pathname || '/admin'
  const adminMenu = resolveAdminPlatformMenu()
  const shopMenu = resolveShopMenu('ADMIN')

  const handleAdminOnlyClick = () => {
    clearAdminActingShopSlug()
    setActingSlug(null)
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className={`flex h-screen ${panel.contentBg}`}>
      <aside className={`hidden shrink-0 flex-col ${panel.sidebarBg} text-white md:flex md:overflow-y-auto`}>
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5">
          <AppSidebar
            menu={adminMenu}
            pathname={effectivePath}
            onNavigate={(href) => router.push(href)}
            storageKey="turneiro-admin-sidebar-open"
            railStorageKey="turneiro-admin-sidebar-rail"
            header={
              <div className={`border-b ${panel.navBorder} pb-4`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                  Panel admin
                </p>
                <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                  {adminEmail ?? 'Administrador'}
                </p>
              </div>
            }
            footer={
              <Link
                href="/login"
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
              >
                <span aria-hidden>←</span>
                Volver al login
              </Link>
            }
          />

          {hybrid && (
            <>
              <div className={`my-2 border-t ${panel.navBorder}`} role="separator" />
              <AppSidebar
                menu={shopMenu}
                pathname={effectivePath}
                onNavigate={(href) => router.push(href)}
                storageKey="turneiro-admin-shop-sidebar-open"
                railStorageKey="turneiro-admin-shop-sidebar-rail"
                disableRailCollapse
                header={
                  <div className={`border-b ${panel.navBorder} pb-3`}>
                    <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                      Vista de la tienda
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                      {businessName ?? actingSlug ?? 'Tienda'}
                    </p>
                  </div>
                }
                footer={
                  <>
                    <button type="button" onClick={handleAdminOnlyClick} className={panel.outlineBtn}>
                      Ir solo a admin (sin tienda)
                    </button>
                    {businessSlug && (
                      <Link
                        href="/"
                        className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
                      >
                        <span aria-hidden>←</span>
                        Volver a la página principal
                      </Link>
                    )}
                  </>
                }
              />
            </>
          )}
        </div>
      </aside>

      <div className="relative flex h-full flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">{children}</div>

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
              href="/admin"
              className="flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
            >
              Inicio
            </Link>
          </div>
        </nav>

        <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Navegación">
          <div className="space-y-4">
            <AppSidebar
              menu={adminMenu}
              pathname={effectivePath}
              onNavigate={(href) => {
                setMobileOpen(false)
                router.push(href)
              }}
              forceExpanded
              header={
                <div className={`border-b ${panel.navBorder} pb-4`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                    Panel admin
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                    {adminEmail ?? 'Administrador'}
                  </p>
                </div>
              }
              footer={
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
                >
                  <span aria-hidden>←</span>
                  Volver al login
                </Link>
              }
            />

            {hybrid && (
              <AppSidebar
                menu={shopMenu}
                pathname={effectivePath}
                onNavigate={(href) => {
                  setMobileOpen(false)
                  router.push(href)
                }}
                forceExpanded
                disableRailCollapse
                header={
                  <div className={`border-b ${panel.navBorder} pb-3`}>
                    <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                      Vista de la tienda
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                      {businessName ?? actingSlug ?? 'Tienda'}
                    </p>
                  </div>
                }
                footer={
                  <>
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
                    {businessSlug && (
                      <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
                      >
                        <span aria-hidden>←</span>
                        Volver a la página principal
                      </Link>
                    )}
                  </>
                }
              />
            )}
          </div>
        </MobileSidebarDrawer>
      </div>
    </div>
  )
}

export default function AdminLayout({
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
    if (!user || user.role !== 'ADMIN') {
      router.replace('/setting')
      return
    }
    setAllowed(true)
  }, [router])

  if (allowed === null) {
    return <LoadingSpinner bgColor="bg-neutral-50" />
  }

  if (!allowed) {
    return null
  }

  return <AdminShell>{children}</AdminShell>
}
