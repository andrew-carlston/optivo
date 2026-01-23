import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, deleteFromR2, type UploadType } from '@/lib/r2'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

// Max file sizes in bytes
const MAX_FILE_SIZES: Record<UploadType, number> = {
  avatar: 5 * 1024 * 1024,    // 5MB for avatars
  logo: 10 * 1024 * 1024,     // 10MB for logos
  document: 50 * 1024 * 1024, // 50MB for documents
}

// Allowed mime types
const ALLOWED_MIME_TYPES: Record<UploadType, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  logo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenant }
    })

    if (!tenantRecord) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as UploadType | null
    const userId = formData.get('userId') as string | null
    const documentId = formData.get('documentId') as string | null

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!type || !['avatar', 'logo', 'document'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be: avatar, logo, or document' },
        { status: 400 }
      )
    }

    // Type-specific validation
    if (type === 'avatar' && !userId) {
      return NextResponse.json(
        { error: 'userId is required for avatar uploads' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[type]
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size for ${type}: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate mime type
    const allowedTypes = ALLOWED_MIME_TYPES[type]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to R2
    const { url, key } = await uploadToR2(buffer, file.name, file.type, {
      type,
      tenant,
      userId: userId || undefined,
      documentId: documentId || undefined,
      fileName: file.name,
    })

    // Update database with new URL based on type
    if (type === 'avatar' && userId) {
      // Update core_directory_personal with avatar URL
      const escapedUserId = userId.replace(/'/g, "''")
      const escapedUrl = url.replace(/'/g, "''")

      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_directory_personal
        SET avatar = '${escapedUrl}', updated_at = NOW()
        WHERE directory_id = '${escapedUserId}'
      `)
    } else if (type === 'logo') {
      // Update core_settings with logo URL
      const escapedUrl = url.replace(/'/g, "''")

      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_settings
        SET logo = '${escapedUrl}', updated_at = NOW()
      `)

      // Also update the main tenant record
      await prisma.tenant.update({
        where: { slug: tenant },
        data: { logo: url }
      })
    }

    return NextResponse.json({
      success: true,
      url,
      key,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * DELETE - Remove a file from R2
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const { key } = await request.json()

    // Validate tenant
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    // Verify the key belongs to this tenant (security check)
    if (!key.includes(`/${tenant}/`)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this file' },
        { status: 403 }
      )
    }

    // Delete from R2
    await deleteFromR2(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
