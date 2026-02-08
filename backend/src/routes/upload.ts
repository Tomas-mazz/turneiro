import path from 'path'
import fs from 'fs'
import { Router, Request, Response } from 'express'
import multer from 'multer'
import { requireAdmin } from '../middleware/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || path.extname(file.mimetype) || ''
    const base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
    cb(null, base + ext.toLowerCase())
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
    if (ok) cb(null, true)
    else cb(new Error('Solo se permiten imágenes o videos (MP4, WebM)'))
  },
})

const router = Router()

router.post(
  '/',
  requireAdmin,
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
  (req: Request, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No se envió ningún archivo' })
      return
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const url = `${baseUrl}/uploads/${file.filename}`
    res.json({ url })
  }
)

export default router
