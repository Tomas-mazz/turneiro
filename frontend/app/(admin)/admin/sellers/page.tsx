'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createAdminSeller, getAdminSellers } from '@/lib/api'
import type { AdminSellerListItem } from '@/types'

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<AdminSellerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const load = () => {
    setLoading(true)
    getAdminSellers()
      .then(setSellers)
      .catch(() => setError('Error al cargar vendedores'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await createAdminSeller({
        name: form.name.trim() || null,
        email: form.email.trim(),
        password: form.password,
      })
      setForm({ name: '', email: '', password: '' })
      load()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setCreateError(msg || 'Error al crear vendedor')
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4 sm:mb-8 sm:pb-6">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Vendedores</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Creá y consultá vendedores. Cada vendedor ve solo los negocios que creó.
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Crear vendedor</h2>
        <p className="mt-1 text-sm text-neutral-500">
          El vendedor inicia sesión con email y contraseña.
        </p>

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Nombre (opcional)</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              placeholder="Ej: Juan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              placeholder="vendedor@correo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Contraseña *</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              placeholder="mín. 6 caracteres"
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear vendedor'}
            </button>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">Listado</h2>
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

        {!loading && !error && sellers.length === 0 && (
          <div className="px-4 py-8 sm:px-6">
            <p className="text-neutral-600">No hay vendedores.</p>
          </div>
        )}

        {!loading && !error && sellers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Negocios creados
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="text-sm font-medium text-neutral-900">
                        {s.name || s.email}
                      </div>
                      <div className="text-xs text-neutral-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 sm:px-6">
                      {s.businessesCreatedCount}
                    </td>
                    <td className="px-4 py-3 text-right text-sm sm:px-6">
                      <Link
                        href={`/admin/sellers/${s.id}`}
                        className="text-neutral-600 underline hover:text-neutral-900"
                      >
                        Ver detalle
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

