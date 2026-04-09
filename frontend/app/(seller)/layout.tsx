'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { getAuthUser, isAuthenticated, removeAuthToken } from '@/lib/auth'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { panel } from '@/lib/panelTheme'
import { AppSidebar, MobileSidebarDrawer, resolveSellerPlatformMenu } from '@/components/sidebar'

function SellerShell({ children }: { children: React.ReactNode }) {
  const [sellerEmail, setSellerEmail] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const user = getAuthUser()
    setSellerEmail(user?.role === 'SELLER' ? user.email : null)
  }, [pathname])

  const effectivePath = pathname || '/seller'
  const sellerMenu = resolveSellerPlatformMenu()

  return (
    <div className={`flex h-screen ${panel.contentBg}`}>
      <aside className={`hidden w-72 shrink-0 flex-col ${panel.sidebarBg} text-white md:flex md:overflow-y-auto`}>
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5">
          <AppSidebar
            menu={sellerMenu}
            pathname={effectivePath}
            onNavigate={(href) => router.push(href)}
            storageKey="turneiro-seller-sidebar-open"
            header={
              <div className={`border-b ${panel.navBorder} pb-4`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                  Panel vendedor
                </p>
                <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                  {sellerEmail ?? 'Vendedor'}
                </p>
              </div>
            }
            footer={
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    removeAuthToken()
                    router.push('/login')
                  }}
                  className={panel.outlineBtn}
                >
                  Cerrar sesión
                </button>
                <Link
                  href="/"
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${panel.footerLink}`}
                >
                  <span aria-hidden>←</span>
                  Volver al inicio
                </Link>
              </div>
            }
          />
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
              href="/seller"
              className="flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
            >
              Inicio
            </Link>
          </div>
        </nav>

        <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Navegación">
          <AppSidebar
            menu={sellerMenu}
            pathname={effectivePath}
            onNavigate={(href) => {
              setMobileOpen(false)
              router.push(href)
            }}
            forceExpanded
            header={
              <div className={`border-b ${panel.navBorder} pb-4`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${panel.labelMuted}`}>
                  Panel vendedor
                </p>
                <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
                  {sellerEmail ?? 'Vendedor'}
                </p>
              </div>
            }
          />
        </MobileSidebarDrawer>
      </div>
    </div>
  )
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const user = getAuthUser()
    if (!user || user.role !== 'SELLER') {
      router.replace(user?.role === 'ADMIN' ? '/admin' : '/setting')
      return
    }
    setAllowed(true)
  }, [router])

  if (allowed === null) {
    return <LoadingSpinner bgColor="bg-neutral-50" />
  }
  if (!allowed) return null

  return <SellerShell>{children}</SellerShell>
}

