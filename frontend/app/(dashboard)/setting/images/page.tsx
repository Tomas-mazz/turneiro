'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getBusinessImages, updateBusinessImages, uploadAdminFile } from '@/lib/api'
import type { BusinessImages } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useBusinessLogo } from '@/lib/businessLogoContext'

export default function ImagesPage() {
  const router = useRouter()
  const businessLogo = useBusinessLogo()
  const [images, setImages] = useState<BusinessImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [logo, setLogo] = useState<string | null>(null)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [coverVideo, setCoverVideo] = useState<string | null>(null)
  const [coverPhotoMobile, setCoverPhotoMobile] = useState<string | null>(null)
  const [coverVideoMobile, setCoverVideoMobile] = useState<string | null>(null)

  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [desktopUploading, setDesktopUploading] = useState(false)
  const [desktopUploadError, setDesktopUploadError] = useState<string | null>(null)
  const [mobileUploading, setMobileUploading] = useState(false)
  const [mobileUploadError, setMobileUploadError] = useState<string | null>(null)

  useEffect(() => {
    const user = getAuthUser()
    if (user?.role !== 'OWNER') {
      router.replace('/setting')
      return
    }

    setLoading(true)
    getBusinessImages()
      .then((img) => {
        setImages(img)
        setLogo(img.logo)
        setCoverPhoto(img.coverPhoto)
        setCoverVideo(img.coverVideo)
        setCoverPhotoMobile(img.coverPhotoMobile)
        setCoverVideoMobile(img.coverVideoMobile)
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || 'Error al cargar las imágenes'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Solo se permiten imágenes')
      return
    }
    setLogoUploadError(null)
    setLogoUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setLogo(url)
    } catch {
      setLogoUploadError('Error al subir el archivo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setDesktopUploadError('Elegí una imagen o un video')
      return
    }
    setDesktopUploadError(null)
    setDesktopUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setCoverPhoto(isImage ? url : null)
      setCoverVideo(isVideo ? url : null)
    } catch {
      setDesktopUploadError('Error al subir el archivo')
    } finally {
      setDesktopUploading(false)
      e.target.value = ''
    }
  }

  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setMobileUploadError('Elegí una imagen o un video')
      return
    }
    setMobileUploadError(null)
    setMobileUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setCoverPhotoMobile(isImage ? url : null)
      setCoverVideoMobile(isVideo ? url : null)
    } catch {
      setMobileUploadError('Error al subir el archivo')
    } finally {
      setMobileUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const updated = await updateBusinessImages({
        logo,
        coverPhoto,
        coverVideo,
        coverPhotoMobile,
        coverVideoMobile,
      })
      setImages(updated)
      setLogo(updated.logo)
      setCoverPhoto(updated.coverPhoto)
      setCoverVideo(updated.coverVideo)
      setCoverPhotoMobile(updated.coverPhotoMobile)
      setCoverVideoMobile(updated.coverVideoMobile)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner logo={businessLogo} bgColor="bg-neutral-100" fullScreen={false} />
  }

  if (error && !images) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      </div>
    )
  }

  const hasDesktopCover = coverPhoto || coverVideo
  const hasMobileCover = coverPhotoMobile || coverVideoMobile

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Imágenes del negocio</h1>

      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Logo del negocio
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            Aparecerá en el header de la página y como ícono de carga.
          </p>

          {logo && (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={logo}
                alt="Logo"
                className="h-16 w-16 rounded-full object-cover border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Quitar logo
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={logoUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {logoUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {logoUploadError && <p className="mt-1 text-sm text-red-600">{logoUploadError}</p>}
        </div>

        <hr className="border-neutral-200" />

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Imagen o video de portada (desktop)
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            Se mostrará en la página de tu negocio en computadoras.
          </p>

          {hasDesktopCover && (
            <div className="mb-3">
              {coverVideo ? (
                <video
                  src={coverVideo}
                  className="h-40 w-full rounded-lg object-cover border border-neutral-200"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : coverPhoto ? (
                <img
                  src={coverPhoto}
                  alt="Portada desktop"
                  className="h-40 w-full rounded-lg object-cover border border-neutral-200"
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setCoverPhoto(null)
                  setCoverVideo(null)
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Quitar portada desktop
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleDesktopUpload}
            disabled={desktopUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {desktopUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {desktopUploadError && <p className="mt-1 text-sm text-red-600">{desktopUploadError}</p>}
        </div>

        <hr className="border-neutral-200" />

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Imagen o video de portada (mobile)
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            Se mostrará en la página de tu negocio en celulares. Si no se sube, se usará la de desktop.
          </p>

          {hasMobileCover && (
            <div className="mb-3">
              {coverVideoMobile ? (
                <video
                  src={coverVideoMobile}
                  className="h-40 w-full rounded-lg object-cover border border-neutral-200"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : coverPhotoMobile ? (
                <img
                  src={coverPhotoMobile}
                  alt="Portada mobile"
                  className="h-40 w-full rounded-lg object-cover border border-neutral-200"
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setCoverPhotoMobile(null)
                  setCoverVideoMobile(null)
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Quitar portada mobile
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleMobileUpload}
            disabled={mobileUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {mobileUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {mobileUploadError && <p className="mt-1 text-sm text-red-600">{mobileUploadError}</p>}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
            saved
              ? 'bg-emerald-600'
              : 'bg-sky-600 hover:bg-sky-700 disabled:bg-neutral-300'
          }`}
        >
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
