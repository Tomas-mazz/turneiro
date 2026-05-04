'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSellerBusiness, uploadSellerFile } from '@/lib/api'
import type { CreateSellerBusinessBody } from '@/types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SellerNewBusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<CreateSellerBusinessBody>({
    name: '',
    slug: '',
    category: 'barbershop',
    description: '',
    phone: '',
    email: '',
    address: '',
    coverPhoto: '',
    coverVideo: '',
    coverPhotoMobile: '',
    coverVideoMobile: '',
    logo: '',
    ownerEmail: '',
    ownerPassword: '',
    theme: 'DARK',
  })

  const [coverDesktopUploading, setCoverDesktopUploading] = useState(false)
  const [coverDesktopUploadError, setCoverDesktopUploadError] = useState<string | null>(null)
  const [coverMobileUploading, setCoverMobileUploading] = useState(false)
  const [coverMobileUploadError, setCoverMobileUploadError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'name' && !form.slug) {
      setForm((prev) => ({ ...prev, slug: slugify(value) }))
    }
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleCoverDesktopFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverDesktopUploadError('Elegí una imagen o un video')
      return
    }
    setCoverDesktopUploadError(null)
    setCoverDesktopUploading(true)
    try {
      const { url } = await uploadSellerFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhoto: isImage ? url : '',
        coverVideo: isVideo ? url : '',
      }))
    } catch {
      setCoverDesktopUploadError('Error al subir el archivo')
    } finally {
      setCoverDesktopUploading(false)
      e.target.value = ''
    }
  }

  const handleCoverMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverMobileUploadError('Elegí una imagen o un video')
      return
    }
    setCoverMobileUploadError(null)
    setCoverMobileUploading(true)
    try {
      const { url } = await uploadSellerFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhotoMobile: isImage ? url : '',
        coverVideoMobile: isVideo ? url : '',
      }))
    } catch {
      setCoverMobileUploadError('Error al subir el archivo')
    } finally {
      setCoverMobileUploading(false)
      e.target.value = ''
    }
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Solo se permiten imágenes')
      return
    }
    setLogoUploadError(null)
    setLogoUploading(true)
    try {
      const { url } = await uploadSellerFile(file)
      setForm((prev) => ({ ...prev, logo: url }))
    } catch {
      setLogoUploadError('Error al subir el archivo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      const body: CreateSellerBusinessBody = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        category: form.category.trim(),
        theme: 'DARK',
      }
      if (form.description?.trim()) body.description = form.description.trim()
      if (form.phone?.trim()) body.phone = form.phone.trim()
      if (form.email?.trim()) body.email = form.email.trim()
      if (form.address?.trim()) body.address = form.address.trim()
      if (form.coverPhoto?.trim()) body.coverPhoto = form.coverPhoto.trim()
      if (form.coverVideo?.trim()) body.coverVideo = form.coverVideo.trim()
      if (form.coverPhotoMobile?.trim()) body.coverPhotoMobile = form.coverPhotoMobile.trim()
      if (form.coverVideoMobile?.trim()) body.coverVideoMobile = form.coverVideoMobile.trim()
      if (form.logo?.trim()) body.logo = form.logo.trim()
      if (form.ownerEmail?.trim()) body.ownerEmail = form.ownerEmail.trim()
      if (form.ownerPassword?.trim()) body.ownerPassword = form.ownerPassword

      const result = await createSellerBusiness(body)
      router.push(`/seller/businesses/${result.id}`)
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; field?: string; details?: { path: (string | number)[]; message: string }[] } } }).response?.data
          : undefined
      const msg = data?.error ?? 'Error al crear el negocio'
      setError(data?.details?.length ? 'Revisá los campos marcados.' : msg)
      const next: Record<string, string> = {}
      if (data?.details && Array.isArray(data.details)) {
        for (const d of data.details) {
          const key = typeof d.path?.[0] === 'string' ? d.path[0] : String(d.path?.[0] ?? '')
          if (key && d.message) next[key] = d.message
        }
      }
      if (data?.field && data?.error) next[data.field] = data.error
      setFieldErrors(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4">
        <Link
          href="/seller"
          className="text-sm text-neutral-600 underline hover:text-neutral-900"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">Crear negocio</h1>
        <p className="mt-1 text-sm text-neutral-500">Datos base + credenciales del owner (opcional)</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">Datos del negocio</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.name && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.name}</p>}
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
                placeholder="ej: mi-barberia"
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.slug && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.slug}</p>}
              <p className="mt-0.5 text-xs text-neutral-500">
                Página de reservas: https://{(form.slug || 'slug').trim()}.turneiro.com
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-neutral-700">
              Categoría *
            </label>
            <select
              id="category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            >
              <option value="barbershop">Barbería</option>
              <option value="salon">Salón</option>
              <option value="wellness">Wellness / estética</option>
              <option value="spa">Spa</option>
              <option value="other">Otro</option>
            </select>
            {fieldErrors.category && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.category}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={form.description ?? ''}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

          <div className="mt-4">
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
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">Marca (opcional)</legend>
          <p className="mb-4 text-xs text-neutral-500">
            Logo y portada se muestran en la página pública de reservas.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Portada (desktop)
              </label>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleCoverDesktopFile}
                disabled={coverDesktopUploading}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {coverDesktopUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
              {coverDesktopUploadError && <p className="mt-1 text-sm text-red-600">{coverDesktopUploadError}</p>}
              {(form.coverPhoto || form.coverVideo) && (
                <p className="mt-1 text-sm text-green-600">
                  Portada cargada.{' '}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverPhoto: '', coverVideo: '' }))}
                    className="underline"
                  >
                    Quitar
                  </button>
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Portada (mobile)
              </label>
              <p className="mb-2 text-xs text-neutral-500">Si no se sube, se usará la de desktop.</p>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleCoverMobileFile}
                disabled={coverMobileUploading}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {coverMobileUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
              {coverMobileUploadError && <p className="mt-1 text-sm text-red-600">{coverMobileUploadError}</p>}
              {(form.coverPhotoMobile || form.coverVideoMobile) && (
                <p className="mt-1 text-sm text-green-600">
                  Portada mobile cargada.{' '}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverPhotoMobile: '', coverVideoMobile: '' }))}
                    className="underline"
                  >
                    Quitar
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700">Logo</label>
            {form.logo && (
              <div className="mb-3 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo} alt="Logo" className="h-16 w-16 rounded-full border border-neutral-200 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, logo: '' }))}
                  className="text-sm text-red-600 underline hover:text-red-700"
                >
                  Quitar logo
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              disabled={logoUploading}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
            {logoUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
            {logoUploadError && <p className="mt-1 text-sm text-red-600">{logoUploadError}</p>}
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">Credenciales del owner (opcional)</legend>
          <p className="mb-3 text-xs text-neutral-500">
            Si cargás email, la contraseña es obligatoria (mín. 6 caracteres).
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
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.ownerEmail && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.ownerEmail}</p>}
            </div>
            <div>
              <label htmlFor="ownerPassword" className="mb-1 block text-sm text-neutral-600">
                Contraseña
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                value={form.ownerPassword ?? ''}
                onChange={handleChange}
                minLength={6}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.ownerPassword && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.ownerPassword}</p>}
            </div>
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear negocio'}
          </button>
          <Link
            href="/seller"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  )
}

