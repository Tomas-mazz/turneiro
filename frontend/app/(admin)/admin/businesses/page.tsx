'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAdminBusinesses } from '@/lib/api'
import type { AdminBusinessListItem } from '@/types'

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminBusinesses()
      .then(setBusinesses)
      .catch(() => setError('Error al cargar los negocios'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
            Negocios
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Listado de todos los negocios. Ver página de reservas o editar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/appointments"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            Ver citas
          </Link>
          <Link
            href="/admin/businesses/new"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            Crear negocio
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
            Negocios
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Listado de todos los negocios. Ver página de reservas o editar.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <p className="text-neutral-500">Cargando...</p>
          </div>
        )}

        {error && (
          <div className="px-4 py-6 sm:px-6">
            <p className="text-red-600">{error}</p>
            <Link
              href="/login"
              className="mt-2 inline-block text-sm text-neutral-600 underline hover:text-neutral-700"
            >
              Volver al login
            </Link>
          </div>
        )}

        {!loading && !error && businesses.length === 0 && (
          <div className="px-4 py-8 sm:px-6">
            <p className="text-neutral-600">No hay negocios cargados.</p>
            <p className="mt-1 text-sm text-neutral-500">
              Ejecutá{' '}
              <code className="rounded bg-neutral-100 px-1">npm run db:seed</code>{' '}
              para crear datos de prueba.
            </p>
            <Link
              href="/admin/businesses/new"
              className="mt-3 inline-block text-sm font-medium text-neutral-900 underline hover:no-underline"
            >
              Crear primer negocio
            </Link>
          </div>
        )}

        {!loading && !error && businesses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Negocio
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:table-cell sm:px-6">
                    Categoría
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 md:table-cell md:px-6">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Servicios
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Citas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50">
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <div>
                        <span className="font-medium text-neutral-900">
                          {b.name}
                        </span>
                        <div className="text-xs text-neutral-500">/{b.slug}</div>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-neutral-600 sm:table-cell sm:px-6">
                      {b.category}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-neutral-600 md:table-cell md:px-6">
                      {b.email || b.phone || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600 sm:px-6">
                      {b.servicesCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600 sm:px-6">
                      {b.appointmentsCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      <span className="inline-flex gap-3">
                        <a
                          href={`/${b.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-600 underline hover:text-neutral-900"
                        >
                          Ver reservas
                        </a>
                        <Link
                          href={`/admin/businesses/${b.id}`}
                          className="text-neutral-600 underline hover:text-neutral-900"
                        >
                          Editar
                        </Link>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

