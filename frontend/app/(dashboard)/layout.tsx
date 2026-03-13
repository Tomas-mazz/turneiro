'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  isAuthenticated,
  getAuthUser,
  getAdminActingShopSlug,
  clearAdminActingShopSlug,
} from '@/lib/auth'
import { getMyBusiness } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { BusinessLogoProvider } from '@/lib/businessLogoContext'

type DashboardRole = 'OWNER' | 'STAFF' | 'ADMIN_HYBRID' | null

type NavItem = {
  id: 'home' | 'services' | 'hours' | 'block' | 'cancel' | 'profile' | 'images'
  label: string
  href: string
}

type AdminNavItem = {
  id: 'home' | 'businesses' | 'appointments' | 'newBusiness'
  label: string
  href: string
}

const OWNER_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', href: '/setting' },
  { id: 'profile', label: 'Mi perfil', href: '/setting/profile' },
  { id: 'services', label: 'Servicios', href: '/setting/services' },
  { id: 'hours', label: 'Horarios', href: '/setting/hours' },
  { id: 'block', label: 'Bloquear días u horarios', href: '/setting/blocking' },
  { id: 'cancel', label: 'Cancelar turnos', href: '/setting/cancel' },
  { id: 'images', label: 'Imágenes', href: '/setting/images' },
]

const STAFF_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', href: '/setting' },
  { id: 'profile', label: 'Mi perfil', href: '/setting/profile' },
  { id: 'block', label: 'Bloquear días u horarios', href: '/setting/blocking' },
  { id: 'cancel', label: 'Cancelar turnos', href: '/setting/cancel' },
]

const ADMIN_ITEMS: AdminNavItem[] = [
  { id: 'home', label: 'Inicio', href: '/admin' },
  { id: 'businesses', label: 'Negocios', href: '/admin/businesses' },
  { id: 'appointments', label: 'Citas', href: '/admin/appointments' },
  { id: 'newBusiness', label: 'Crear negocio', href: '/admin/businesses/new' },
]

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DashboardRole>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
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

  const items = role === 'STAFF' ? STAFF_ITEMS : OWNER_ITEMS

  const effectivePath = pathname || '/setting'

  const handleNavClick =
    (item: NavItem) =>
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      setIsMoreOpen(false)
      if (item.href !== pathname) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        router.push(item.href)
      }
    }

  const isAdminItemActive = (item: AdminNavItem) => {
    if (item.id === 'home') {
      return effectivePath === '/admin' || effectivePath === '/admin/'
    }
    if (item.id === 'businesses') {
      return (
        effectivePath.startsWith('/admin/businesses') &&
        !effectivePath.startsWith('/admin/businesses/new')
      )
    }
    if (item.id === 'newBusiness') {
      return effectivePath.startsWith('/admin/businesses/new')
    }
    return effectivePath.startsWith(item.href)
  }

  /** Same host so localStorage session stays valid (not shared across subdomains). */
  const handleAdminOnlyClick = () => {
    clearAdminActingShopSlug()
    router.push('/admin')
  }

  const handleAdminNavClick =
    (item: AdminNavItem) =>
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      setIsMoreOpen(false)
      router.push(item.href)
    }

  return (
    <div className="flex h-screen bg-neutral-100">
      <aside className="hidden w-72 shrink-0 flex-col bg-sky-700 text-sky-50 md:flex md:overflow-y-auto">
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5">
          {isAdminHybrid && (
            <>
              <div className="border-b border-sky-600 pb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-sky-200">
                  Turneiro (admin)
                </p>
                <p className="mt-1 text-xs text-sky-100">
                  Panel global
                </p>
              </div>
              <nav className="space-y-1 text-sm">
                {ADMIN_ITEMS.map((item) => {
                  const isActive = isAdminItemActive(item)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={handleAdminNavClick(item)}
                      className={`flex w-full items-center rounded-lg px-3 py-2 text-left transition-colors ${
                        isActive
                          ? 'bg-sky-500/90 text-white'
                          : 'text-sky-100 hover:bg-sky-600/70 hover:text-white'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
              <button
                type="button"
                onClick={handleAdminOnlyClick}
                className="rounded-lg border border-sky-500/80 px-3 py-2 text-left text-xs font-medium text-sky-50 hover:bg-sky-600/50"
              >
                Ir solo a admin (sin tienda)
              </button>
              <div className="my-2 border-t border-sky-500" role="separator" />
            </>
          )}
          <div className={isAdminHybrid ? 'border-b border-sky-600 pb-3' : 'border-b border-sky-600 pb-4'}>
            <p className="text-xs font-medium uppercase tracking-wide text-sky-200">
              {isAdminHybrid ? 'Vista de la tienda' : 'Tu negocio'}
            </p>
            <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
              {businessName ?? 'Configuración'}
            </p>
          </div>
          <nav className="space-y-1 text-sm">
            {items.map((item) => {
              const isActive =
                item.id === 'home'
                  ? effectivePath === '/setting' || effectivePath === '/setting/'
                  : effectivePath.startsWith(item.href)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleNavClick(item)}
                  className={`flex w-full items-center rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-sky-500/90 text-white'
                      : 'text-sky-100 hover:bg-sky-600/70 hover:text-white'
                  } ${
                    item.id === 'block' && (role === 'OWNER' || role === 'ADMIN_HYBRID')
                      ? 'ml-4 px-2 py-1.5 text-xs'
                      : 'px-3 py-2 text-sm'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <div className="shrink-0 border-t border-sky-600 px-4 py-4">
          {businessSlug && (
            <Link
              href="/"
              onClick={(event) => {
                event.stopPropagation()
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-50 hover:text-white"
            >
              <span aria-hidden>←</span>
              Volver a la página principal
            </Link>
          )}
        </div>
      </aside>

      <div className="relative flex h-full flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          <BusinessLogoProvider value={businessLogo}>
            {children}
          </BusinessLogoProvider>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-sky-800 bg-sky-700/95 px-3 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.35)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-1">
            {items.slice(0, 2).map((item) => {
              const isActive =
                item.id === 'home'
                  ? effectivePath === '/setting' || effectivePath === '/setting/'
                  : effectivePath.startsWith(item.href)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleNavClick(item)}
                  className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-medium ${
                    isActive ? 'text-white' : 'text-sky-100'
                  }`}
                >
                  <span className="truncate">
                    {item.id === 'block' ? 'Bloquear' : item.label}
                  </span>
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-medium ${
                isMoreOpen ? 'text-white' : 'text-sky-100'
              }`}
            >
              <span className="truncate">Más</span>
              <span className="text-[0.65rem]">
                {isMoreOpen ? '▲' : '▼'}
              </span>
            </button>
          </div>
        </nav>

        {isMoreOpen && (
          <div className="fixed inset-x-0 bottom-12 z-30 mx-auto max-h-[70vh] max-w-md overflow-y-auto px-3 pb-3 md:hidden">
            <div className="overflow-hidden rounded-2xl border border-sky-600 bg-sky-700 shadow-xl">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-100">
                Más opciones
              </div>
              <div className="border-t border-sky-600">
                {isAdminHybrid && (
                  <>
                    <div className="bg-sky-800/50 px-4 py-1.5 text-[0.65rem] font-semibold uppercase text-sky-200">
                      Admin
                    </div>
                    {ADMIN_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={handleAdminNavClick(item)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-sky-50 hover:bg-sky-600"
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false)
                        handleAdminOnlyClick()
                      }}
                      className="flex w-full border-t border-sky-600 px-4 py-2.5 text-left text-sm text-sky-50 hover:bg-sky-600"
                    >
                      Ir solo a admin
                    </button>
                    <div className="bg-sky-800/50 px-4 py-1.5 text-[0.65rem] font-semibold uppercase text-sky-200">
                      Tienda
                    </div>
                  </>
                )}
                {items.map((item) => {
                  const isActive =
                    item.id === 'home'
                      ? effectivePath === '/setting' || effectivePath === '/setting/'
                      : effectivePath.startsWith(item.href)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={handleNavClick(item)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                        isActive
                          ? 'bg-sky-500 text-white'
                          : 'text-sky-50 hover:bg-sky-600'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  )
                })}
                {businessSlug && (
                  <Link
                    href="/"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex w-full items-center justify-between border-t border-sky-600 px-4 py-2.5 text-left text-sm text-sky-50 hover:bg-sky-600"
                  >
                    <span>Ir a la página principal</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
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
