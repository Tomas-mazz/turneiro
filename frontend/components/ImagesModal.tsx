'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  open: boolean
  title: string
  subtitle?: string
  initialImages?: string[]
  maxImages?: number
  onClose: () => void
  onSave: (images: string[]) => Promise<void> | void
  uploadFile: (file: File) => Promise<string>
}

export function ImagesModal({
  open,
  title,
  subtitle,
  initialImages,
  maxImages = 5,
  onClose,
  onSave,
  uploadFile,
}: Props) {
  const initial = useMemo(() => (Array.isArray(initialImages) ? initialImages : []), [initialImages])
  const [draft, setDraft] = useState<string[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDraft(initial)
    setUploading(false)
    setUploadError(null)
  }, [open, initial])

  const handleUpload = async (files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files)
    const onlyImages = selected.filter((f) => f.type.startsWith('image/'))
    if (onlyImages.length !== selected.length) {
      setUploadError('Solo se permiten imágenes')
      return
    }
    const remaining = maxImages - draft.length
    if (remaining <= 0) {
      setUploadError(`Máximo ${maxImages} imágenes`)
      return
    }
    const slice = onlyImages.slice(0, remaining)
    setUploadError(null)
    setUploading(true)
    try {
      const urls: string[] = []
      for (const f of slice) {
        const url = await uploadFile(f)
        urls.push(url)
      }
      setDraft((prev) => [...prev, ...urls].slice(0, maxImages))
    } catch {
      setUploadError('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs text-neutral-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-medium text-neutral-800">
              {draft.length}/{maxImages} cargadas
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || draft.length >= maxImages}
              onChange={(e) => {
                void handleUpload(e.target.files)
                e.target.value = ''
              }}
              className="block text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 disabled:opacity-60"
            />
          </div>

          {uploading ? <p className="mt-2 text-sm text-neutral-500">Subiendo...</p> : null}
          {uploadError ? <p className="mt-2 text-sm text-red-600">{uploadError}</p> : null}

          {draft.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {draft.map((url) => (
                <div key={url} className="relative overflow-hidden rounded-lg border border-neutral-200">
                  <img src={url} alt="Imagen" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => prev.filter((x) => x !== url))}
                    className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-red-700 shadow hover:bg-white"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">Todavía no hay imágenes cargadas.</p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={async () => {
              const unique = Array.from(new Set(draft)).slice(0, maxImages)
              await onSave(unique)
            }}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

