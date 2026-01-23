import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Cloudflare R2 Storage Client
 *
 * R2 is S3-compatible, so we use the AWS SDK with R2 endpoint.
 *
 * File organization:
 * - avatars/{tenant}/{userId}.{ext}     - User profile pictures
 * - logos/{tenant}/logo.{ext}           - Company logos
 * - documents/{tenant}/{docId}.{ext}    - General documents
 */

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'optivo'
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

export type UploadType = 'avatar' | 'logo' | 'document'

interface UploadOptions {
  type: UploadType
  tenant: string
  userId?: string
  documentId?: string
  fileName?: string
}

/**
 * Generate the storage key (path) for a file
 */
function getStorageKey(options: UploadOptions, extension: string): string {
  const { type, tenant, userId, documentId, fileName } = options

  switch (type) {
    case 'avatar':
      if (!userId) throw new Error('userId required for avatar upload')
      return `avatars/${tenant}/${userId}.${extension}`

    case 'logo':
      return `logos/${tenant}/logo.${extension}`

    case 'document':
      if (!documentId && !fileName) throw new Error('documentId or fileName required for document upload')
      const name = fileName || documentId
      return `documents/${tenant}/${name}.${extension}`

    default:
      throw new Error(`Unknown upload type: ${type}`)
  }
}

/**
 * Get the file extension from a filename or mime type
 */
function getExtension(filename: string, mimeType?: string): string {
  // Try to get extension from filename
  const fromFilename = filename.split('.').pop()?.toLowerCase()
  if (fromFilename && fromFilename.length <= 5) {
    return fromFilename
  }

  // Fall back to mime type
  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/json': 'json',
  }

  return mimeType ? (mimeExtensions[mimeType] || 'bin') : 'bin'
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  filename: string,
  mimeType: string,
  options: UploadOptions
): Promise<{ url: string; key: string }> {
  const extension = getExtension(filename, mimeType)
  const key = getStorageKey(options, extension)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    // Cache for 1 year (immutable content with unique keys)
    CacheControl: 'public, max-age=31536000, immutable',
  })

  await r2Client.send(command)

  // Return the public URL
  const url = `${PUBLIC_URL}/${key}`

  return { url, key }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Generate a presigned URL for direct upload (client-side)
 * Expires in 5 minutes
 */
export async function getPresignedUploadUrl(
  options: UploadOptions,
  extension: string,
  mimeType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const key = getStorageKey(options, extension)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })
  const publicUrl = `${PUBLIC_URL}/${key}`

  return { uploadUrl, key, publicUrl }
}

/**
 * Generate a presigned URL for downloading (private files)
 * Expires in 1 hour
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(r2Client, command, { expiresIn: 3600 })
}

/**
 * Get the public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

export { r2Client, BUCKET_NAME }
