'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getAdminBusiness,
  updateAdminBusiness,
  uploadAdminFile,
} from '@/lib/api'
import type { AdminBusinessDetail, UpdateBusinessBody } from '@/types'

export default function AdminBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [business, setBusiness] = useState<AdminBusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<UpdateBusinessBody>({
    name: '',
    slug: '',
    category: 'barbershop',
    description: '',
    phone: '',
    email: '',
    address: '',
    logo: '',
    coverPhoto: '',
    coverVideo: '',
    theme: 'DARK',
    paymentRequired: false,
    ownerEmail: '',
    ownerPassword: '',
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getAdminBusiness(id)
      .then((b) => {
        setBusiness(b)
        setForm({
          name: b.name,
          slug: b.slug,
          category: b.category,
          description: b.description ?? '',
          phone: b.phone ?? '',
          email: b.email ?? '',
          address: b.address ?? '',
          logo: b.logo ?? '',
          coverPhoto: b.coverPhoto ?? '',
          coverVideo: b.coverVideo ?? '',
          theme: (b.theme === 'LIGHT' ? 'LIGHT' : 'DARK') as 'DARK' | 'LIGHT',
          paymentRequired: b.settings?.paymentRequired ?? false,
          ownerEmail: b.owner?.email ?? '',
          ownerPassword: '',
        })
      })
      .catch(() => setError('Negocio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setLogoUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({ ...prev, logo: url }))
    } catch {
      setError('Error al subir el logo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverUploadError('Elegí una imagen o un video')
      return
    }
    setCoverUploadError(null)
    setCoverUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhoto: isImage ? url : '',
        coverVideo: isVideo ? url : '',
      }))
    } catch {
      setCoverUploadError('Error al subir el archivo')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSaving(true)
    try {
      const body: UpdateBusinessBody = {
        name: form.name?.trim(),
        slug: form.slug?.trim(),
        category: form.category?.trim(),
        paymentRequired: form.paymentRequired,
        theme: form.theme,
      }
      if (form.description !== undefined) body.description = (form.description ?? '').toString().trim() || null
      if (form.phone !== undefined) body.phone = (form.phone ?? '').toString().trim() || null
      if (form.email !== undefined) body.email = (form.email ?? '').toString().trim() || null
      if (form.address !== undefined) body.address = (form.address ?? '').toString().trim() || null
      if (form.logo !== undefined) body.logo = form.logo?.trim() || null
      if (form.coverPhoto !== undefined) body.coverPhoto = form.coverPhoto?.trim() || null
      if (form.coverVideo !== undefined) body.coverVideo = form.coverVideo?.trim() || null
      if (form.ownerEmail !== undefined) body.ownerEmail = form.ownerEmail.trim() || undefined
      if (form.ownerPassword?.trim()) body.ownerPassword = form.ownerPassword

      await updateAdminBusiness(id, body)
      router.push('/admin')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    )
  }

  if (error && !business) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <Link href="/admin" className="text-sm text-neutral-600 underline hover:text-neutral-900">
          ← Volver al panel
        </Link>
        <p className="mt-4 text-red-600">{error}</p>
      </main>
    )
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4">
        <Link
          href="/admin"
          className="text-sm text-neutral-600 underline hover:text-neutral-900"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">
          Editar negocio
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {business?.name} · /{business?.slug}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre del negocio *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-neutral-700">
              Slug (URL) *
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={form.slug}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
            <p className="mt-0.5 text-xs text-neutral-500">
              Página de reservas: /{form.slug || 'slug'}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-neutral-700">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          >
            <option value="barbershop">Barbería</option>
            <option value="salon">Salón</option>
            <option value="spa">Spa</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={form.description ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={form.phone ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email de contacto
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-neutral-700">
            Dirección
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoFile}
            disabled={logoUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {logoUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {(form.logo ?? '') && (
            <p className="mt-1 text-sm text-green-600">
              Logo cargado. <button type="button" onClick={() => setForm((p) => ({ ...p, logo: '' }))} className="underline">Quitar</button>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Imagen o video de portada
          </label>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleCoverFile}
            disabled={coverUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {coverUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {coverUploadError && <p className="mt-1 text-sm text-red-600">{coverUploadError}</p>}
          {((form.coverPhoto ?? '') || (form.coverVideo ?? '')) && (
            <p className="mt-1 text-sm text-green-600">
              Portada cargada. <button type="button" onClick={() => setForm((p) => ({ ...p, coverPhoto: '', coverVideo: '' }))} className="underline">Quitar</button>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Tema / fondo de la página
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                checked={form.theme === 'DARK'}
                onChange={() => setForm((p) => ({ ...p, theme: 'DARK' }))}
                className="text-neutral-900"
              />
              <span>Tema oscuro</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                checked={form.theme === 'LIGHT'}
                onChange={() => setForm((p) => ({ ...p, theme: 'LIGHT' }))}
                className="text-neutral-900"
              />
              <span>Tema claro (fondo blanco)</span>
            </label>
          </div>
        </div>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Reserva con pago antes de confirmar
          </legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentRequired"
                checked={!form.paymentRequired}
                onChange={() => setForm((p) => ({ ...p, paymentRequired: false }))}
                className="text-neutral-900"
              />
              <span>Sin pago antes de la reserva</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentRequired"
                checked={form.paymentRequired}
                onChange={() => setForm((p) => ({ ...p, paymentRequired: true }))}
                className="text-neutral-900"
              />
              <span>Con pago antes de la reserva</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Credenciales del dueño del negocio
          </legend>
          <p className="mb-3 text-xs text-neutral-500">
            Email actual del owner (solo lectura). Para cambiar el email o la contraseña, completá los campos y guardá.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ownerEmail" className="mb-1 block text-sm text-neutral-600">
                Email del owner
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                value={form.ownerEmail ?? ''}
                onChange={handleChange}
                placeholder={business?.owner?.email ? undefined : 'Sin owner asignado'}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label htmlFor="ownerPassword" className="mb-1 block text-sm text-neutral-600">
                Nueva contraseña (dejar en blanco para no cambiar)
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                value={form.ownerPassword ?? ''}
                onChange={handleChange}
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </Link>
          <a
            href={business ? `/${business.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Ver página de reservas →
          </a>
        </div>
      </form>
    </main>
  )
}
