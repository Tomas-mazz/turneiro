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

/** Payload for browser direct upload to Cloudinary (bypasses Vercel ~4.5MB body limit). */
export type CloudinaryDirectSignPayload = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  resourceType: 'image' | 'video'
}

/**
 * Signed params for POST https://api.cloudinary.com/v1_1/<cloud>/<image|video>/upload
 * Keeps API secret on the server; the file never transits through the API host.
 */
export function buildDirectUploadSignature(
  resourceType: 'image' | 'video'
): CloudinaryDirectSignPayload | null {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null
  }
  const timestamp = Math.round(Date.now() / 1000)
  const folder = CLOUDINARY_UPLOAD_FOLDER
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
  }
  const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET)
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    resourceType,
  }
}

export { cloudinary }

