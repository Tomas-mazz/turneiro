import { v2 as cloudinary } from 'cloudinary'

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER,
} = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // In local/dev we log a warning; in production this should be configured.
  console.warn(
    'Cloudinary environment variables are not fully configured. ' +
      'File uploads will fail until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ' +
      'and CLOUDINARY_API_SECRET are set.'
  )
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

export const CLOUDINARY_UPLOAD_FOLDER = CLOUDINARY_FOLDER || 'turneiro/uploads'

export { cloudinary }

