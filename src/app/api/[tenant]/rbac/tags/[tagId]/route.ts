import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RbacTag,
  RbacTagRow,
  UpdateTagRequest,
  rowToTag
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string; tagId: string }>
}

// ============================================================================
// GET - Get a single tag by ID
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, tagId } = await params

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

    // Query the tag
    const tagRecords = await prisma.$queryRawUnsafe<RbacTagRow[]>(`
      SELECT
        id, name, display_name, description, is_archived, created_at, updated_at
      FROM "${tenant}".core_rbac_tags
      WHERE id = '${tagId.replace(/'/g, "''")}'
      LIMIT 1
    `)

    if (tagRecords.length === 0) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    const tag: RbacTag = rowToTag(tagRecords[0])

    return NextResponse.json({ data: tag })
  } catch (error) {
    console.error('rbac tag GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// PUT - Update a tag (name, archived status)
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, tagId } = await params
    const body: UpdateTagRequest = await request.json()

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

    // Check if tag exists
    const existingTags = await prisma.$queryRawUnsafe<RbacTagRow[]>(`
      SELECT * FROM "${tenant}".core_rbac_tags WHERE id = '${tagId.replace(/'/g, "''")}'
    `)

    if (existingTags.length === 0) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Validate fields
    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string' || body.displayName.trim().length < 2) {
        return NextResponse.json(
          { error: 'displayName must be at least 2 characters' },
          { status: 400 }
        )
      }
      if (body.displayName.trim().length > 100) {
        return NextResponse.json(
          { error: 'displayName must be 100 characters or less' },
          { status: 400 }
        )
      }
    }

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !/^[a-z0-9_]+$/.test(body.name)) {
        return NextResponse.json(
          { error: 'name can only contain lowercase letters, numbers, and underscores' },
          { status: 400 }
        )
      }

      // Check for duplicate name (excluding current tag)
      const duplicateCheck = await prisma.$queryRawUnsafe<{ id: string }[]>(`
        SELECT id FROM "${tenant}".core_rbac_tags
        WHERE name = '${body.name.replace(/'/g, "''")}'
        AND id != '${tagId.replace(/'/g, "''")}'
      `)

      if (duplicateCheck.length > 0) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        )
      }
    }

    if (body.isArchived !== undefined && typeof body.isArchived !== 'boolean') {
      return NextResponse.json(
        { error: 'isArchived must be a boolean' },
        { status: 400 }
      )
    }

    // Build update query
    const updates: string[] = []

    if (body.name !== undefined) {
      updates.push(`name = '${body.name.replace(/'/g, "''")}'`)
    }
    if (body.displayName !== undefined) {
      updates.push(`display_name = '${body.displayName.trim().replace(/'/g, "''")}'`)
    }
    if (body.description !== undefined) {
      updates.push(body.description === null
        ? 'description = NULL'
        : `description = '${body.description.replace(/'/g, "''")}'`
      )
    }
    if (body.isArchived !== undefined) {
      updates.push(`is_archived = ${body.isArchived}`)
    }

    updates.push('updated_at = NOW()')

    // Execute update
    await prisma.$executeRawUnsafe(`
      UPDATE "${tenant}".core_rbac_tags
      SET ${updates.join(', ')}
      WHERE id = '${tagId.replace(/'/g, "''")}'
    `)

    // Fetch updated tag
    const updatedTags = await prisma.$queryRawUnsafe<RbacTagRow[]>(`
      SELECT * FROM "${tenant}".core_rbac_tags WHERE id = '${tagId.replace(/'/g, "''")}'
    `)

    if (updatedTags.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch updated tag' },
        { status: 500 }
      )
    }

    const tag: RbacTag = rowToTag(updatedTags[0])

    return NextResponse.json({
      message: 'Tag updated successfully',
      data: tag
    })
  } catch (error) {
    console.error('rbac tag PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// DELETE - Delete a tag
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, tagId } = await params

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

    // Check if tag exists
    const existingTags = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_rbac_tags WHERE id = '${tagId.replace(/'/g, "''")}'
    `)

    if (existingTags.length === 0) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Delete the tag
    await prisma.$executeRawUnsafe(`
      DELETE FROM "${tenant}".core_rbac_tags WHERE id = '${tagId.replace(/'/g, "''")}'
    `)

    return NextResponse.json({
      message: 'Tag deleted successfully'
    })
  } catch (error) {
    console.error('rbac tag DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
