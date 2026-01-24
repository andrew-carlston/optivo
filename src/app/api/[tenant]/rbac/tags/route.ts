import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RbacTag,
  RbacTagRow,
  CreateTagRequest,
  rowToTag
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string }>
}

// ============================================================================
// Validation Helpers
// ============================================================================

function generateTagSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ============================================================================
// Helper - Ensure RBAC Tags table exists
// ============================================================================

async function ensureTagsTable(prisma: ReturnType<typeof createMainPrismaClient>, tenant: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tenant}".core_rbac_tags (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create index on name for faster lookups
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "${tenant}_rbac_tags_name_idx" ON "${tenant}".core_rbac_tags(name)
    `)

    // Create index on is_archived for filtering
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "${tenant}_rbac_tags_archived_idx" ON "${tenant}".core_rbac_tags(is_archived)
    `)
  } catch (error) {
    console.log('Note: Could not create RBAC tags table:', error)
  }
}

// ============================================================================
// GET - List all tags for the tenant
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Ensure table exists
    await ensureTagsTable(prisma, tenant)

    // Check for includeArchived query param
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('includeArchived') === 'true'

    // Query tags
    let tagRecords: RbacTagRow[] = []
    try {
      const archivedFilter = includeArchived ? '' : 'WHERE is_archived = FALSE'
      tagRecords = await prisma.$queryRawUnsafe<RbacTagRow[]>(`
        SELECT
          id,
          name,
          display_name,
          description,
          is_archived,
          created_at,
          updated_at
        FROM "${tenant}".core_rbac_tags
        ${archivedFilter}
        ORDER BY display_name ASC
      `)
    } catch (queryError) {
      console.error('Could not query RBAC tags:', queryError)
      return NextResponse.json(
        { error: 'Failed to query tags' },
        { status: 500 }
      )
    }

    // Transform to API response format
    const tags: RbacTag[] = tagRecords.map(rowToTag)

    return NextResponse.json({ data: tags })
  } catch (error) {
    console.error('rbac tags GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// POST - Create a new tag
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: CreateTagRequest = await request.json()

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

    // Validate required fields
    if (!body.displayName || typeof body.displayName !== 'string') {
      return NextResponse.json(
        { error: 'displayName is required and must be a string' },
        { status: 400 }
      )
    }

    const displayName = body.displayName.trim()
    if (displayName.length < 2 || displayName.length > 100) {
      return NextResponse.json(
        { error: 'displayName must be 2-100 characters' },
        { status: 400 }
      )
    }

    // Generate name from displayName if not provided
    const name = body.name ? body.name.trim() : generateTagSlug(displayName)
    if (!name) {
      return NextResponse.json(
        { error: 'Could not generate valid tag name from displayName' },
        { status: 400 }
      )
    }

    // Validate name format
    if (!/^[a-z0-9_]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Tag name can only contain lowercase letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Ensure table exists
    await ensureTagsTable(prisma, tenant)

    // Check for duplicate name
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_rbac_tags WHERE name = '${name.replace(/'/g, "''")}'
    `)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      )
    }

    // Escape values for SQL
    const escapedDisplayName = displayName.replace(/'/g, "''")
    const escapedName = name.replace(/'/g, "''")
    const escapedDescription = body.description ? body.description.replace(/'/g, "''") : null

    // Insert the tag
    const tagResult = await prisma.$queryRawUnsafe<RbacTagRow[]>(`
      INSERT INTO "${tenant}".core_rbac_tags (
        name, display_name, description
      ) VALUES (
        '${escapedName}',
        '${escapedDisplayName}',
        ${escapedDescription ? `'${escapedDescription}'` : 'NULL'}
      )
      RETURNING id, name, display_name, description, is_archived, created_at, updated_at
    `)

    if (tagResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }

    const newTag = rowToTag(tagResult[0])

    return NextResponse.json({
      message: 'Tag created successfully',
      data: newTag
    }, { status: 201 })
  } catch (error) {
    console.error('rbac tags POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
