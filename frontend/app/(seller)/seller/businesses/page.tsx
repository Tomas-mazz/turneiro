'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSellerBusinesses } from '@/lib/api'
import type { SellerBusinessListItem } from '@/types'

export default function SellerBusinessesPage() {
  const [businesses, setBusinesses] = useState<SellerBusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSellerBusinesses()
      .then(setBusinesses)
      .catch(() => setError('Error al cargar tus negocios'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Mis negocios</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Solo ves los negocios que creaste vos.
          </p>
        </div>
        <Link
          href="/seller/businesses/new"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
        >
          Crear negocio
        </Link>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">Negocios</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Podés editar los datos base y las credenciales del owner.
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
          </div>
        )}

        {!loading && !error && businesses.length === 0 && (
          <div className="px-4 py-8 sm:px-6">
            <p className="text-neutral-600">Todavía no creaste ningún negocio.</p>
            <Link
              href="/seller/businesses/new"
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
                        <span className="font-medium text-neutral-900">{b.name}</span>
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
                      {b.appointmentsCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      <Link
                        href={`/seller/businesses/${b.id}`}
                        className="text-neutral-600 underline hover:text-neutral-900"
                      >
                        Editar
                      </Link>
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

