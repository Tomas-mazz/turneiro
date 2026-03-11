'use client'

import { useEffect, useState } from 'react'
import { getMyProfile, updateMyProfile, uploadAdminFile } from '@/lib/api'
import type { MyProfile } from '@/lib/api'

export default function ProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getMyProfile()
      .then((p) => {
        setProfile(p)
        setName(p.name)
        setPhotoUrl(p.photoUrl)
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || 'Error al cargar el perfil'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten imágenes')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setPhotoUrl(url)
    } catch {
      setUploadError('Error al subir la imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateMyProfile({ name: name.trim(), photoUrl })
      setProfile(updated)
      setName(updated.name)
      setPhotoUrl(updated.photoUrl)
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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-neutral-500">Cargando perfil...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Mi perfil</h1>

      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Foto de perfil
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            Esta foto aparecerá en el calendario de turnos.
          </p>

          {photoUrl && (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={photoUrl}
                alt="Foto de perfil"
                className="h-20 w-20 rounded-full object-cover border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Quitar foto
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {uploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
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
