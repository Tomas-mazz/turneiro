import { Router, Request, Response } from 'express'
import multer from 'multer'
import { requireBusinessOwner } from '../middleware/auth'
import { cloudinary, CLOUDINARY_UPLOAD_FOLDER, buildDirectUploadSignature } from '../lib/cloudinary'
import { Readable } from 'stream'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
    if (ok) cb(null, true)
    else cb(new Error('Solo se permiten imágenes o videos (MP4, WebM)'))
  },
})

const router = Router()

/** Returns signed params so the client can upload directly to Cloudinary (large videos). */
router.post('/signature', requireBusinessOwner, (req: Request, res: Response) => {
  const resourceType = req.body?.resourceType as string | undefined
  if (resourceType !== 'image' && resourceType !== 'video') {
    res.status(400).json({ error: 'Indicá resourceType: image o video' })
    return
  }
  const payload = buildDirectUploadSignature(resourceType)
  if (!payload) {
    res
      .status(503)
      .json({ error: 'Subida de archivos no disponible: Cloudinary no está configurado en el servidor' })
    return
  }
  res.json(payload)
})

router.post(
  '/',
  requireBusinessOwner,
  (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'El archivo no debe superar 20 MB' })
          return
        }
        res.status(400).json({ error: err instanceof Error ? err.message : 'Error al subir' })
        return
      }
      next()
    })
  },
  async (req: Request, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No se envió ningún archivo' })
      return
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      res
        .status(503)
        .json({ error: 'Subida de archivos no disponible: Cloudinary no está configurado en el servidor' })
      return
    }

    const isImage = file.mimetype.startsWith('image/')
    const resourceType = isImage ? 'image' : 'video'

    try {
      const stream = Readable.from(file.buffer)
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: CLOUDINARY_UPLOAD_FOLDER,
            transformation: isImage
              ? [
                  { width: 1920, height: 1080, crop: 'limit' },
                  { fetch_format: 'auto', quality: 'auto' },
                ]
              : undefined,
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error('Cloudinary upload failed'))
              return
            }
            resolve({ secure_url: result.secure_url })
          }
        )
        stream.pipe(uploadStream)
      })

      res.json({ url: uploadResult.secure_url })
    } catch (err) {
      console.error('Error uploading file to Cloudinary:', err)
      res.status(500).json({ error: 'Error al subir el archivo' })
    }
  }
)

export default router
