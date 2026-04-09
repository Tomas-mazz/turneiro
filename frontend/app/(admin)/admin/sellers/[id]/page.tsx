'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getAdminSellerDetail } from '@/lib/api'
import type { AdminSellerDetail } from '@/types'

export default function AdminSellerDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [seller, setSeller] = useState<AdminSellerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getAdminSellerDetail(id)
      .then(setSeller)
      .catch(() => setError('Vendedor no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    )
  }

  if (error || !seller) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <Link href="/admin/sellers" className="text-sm text-neutral-600 underline hover:text-neutral-900">
          ← Volver
        </Link>
        <p className="mt-4 text-red-600">{error ?? 'Vendedor no encontrado'}</p>
      </main>
    )
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4">
        <Link href="/admin/sellers" className="text-sm text-neutral-600 underline hover:text-neutral-900">
          ← Volver a vendedores
        </Link>
        <h1 className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">
          {seller.name || seller.email}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {seller.email} · {seller.businessesCreatedCount} negocios creados
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">Negocios creados</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Estos negocios también aparecen en la sección “Negocios”.
          </p>
        </div>

        {seller.businesses.length === 0 ? (
          <div className="px-4 py-8 sm:px-6">
            <p className="text-neutral-600">Todavía no creó negocios.</p>
          </div>
        ) : (
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
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {seller.businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="text-sm font-medium text-neutral-900">{b.name}</div>
                      <div className="text-xs text-neutral-500">/{b.slug}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell sm:px-6">
                      {b.category}
                    </td>
                    <td className="px-4 py-3 text-right text-sm sm:px-6">
                      <Link
                        href={`/admin/businesses/${b.id}`}
                        className="text-neutral-600 underline hover:text-neutral-900"
                      >
                        Editar (admin)
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

