import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RoleGroup,
  UpdateGroupRequest,
  VALID_ROLE_ICONS,
  RoleIcon
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string; groupId: string }>
}

interface GroupRow {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  icon: string
  priority: number
  created_at: Date
  updated_at: Date
}

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

// ============================================================================
// GET - Get a single group by ID
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, groupId } = await params

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

    // Query the group
    const groupRecords = await prisma.$queryRawUnsafe<GroupRow[]>(`
      SELECT
        id, name, display_name, description, color, icon, priority, created_at, updated_at
      FROM "${tenant}".core_rbac_groups
      WHERE id = '${groupId.replace(/'/g, "''")}'
      LIMIT 1
    `)

    if (groupRecords.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const row = groupRecords[0]

    // Get role count
    const roleCountResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*) as count FROM "${tenant}".core_rbac_roles WHERE group_id = '${groupId.replace(/'/g, "''")}'
    `)
    const roleCount = Number(roleCountResult[0]?.count || 0)

    const group: RoleGroup = {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      color: row.color,
      icon: row.icon as RoleIcon,
      priority: row.priority,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      roleCount
    }

    return NextResponse.json({ data: group })
  } catch (error) {
    console.error('rbac group GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// PUT - Update a group
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, groupId } = await params
    const body: UpdateGroupRequest = await request.json()

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

    // Check if group exists
    const existingGroups = await prisma.$queryRawUnsafe<GroupRow[]>(`
      SELECT * FROM "${tenant}".core_rbac_groups WHERE id = '${groupId.replace(/'/g, "''")}'
    `)

    if (existingGroups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
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
    }

    if (body.color !== undefined) {
      if (typeof body.color !== 'string' || !isValidHexColor(body.color)) {
        return NextResponse.json(
          { error: 'color must be a valid hex color' },
          { status: 400 }
        )
      }
    }

    if (body.icon !== undefined) {
      if (!VALID_ROLE_ICONS.includes(body.icon as RoleIcon)) {
        return NextResponse.json(
          { error: `icon must be one of: ${VALID_ROLE_ICONS.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build update query
    const updates: string[] = []

    if (body.displayName !== undefined) {
      updates.push(`display_name = '${body.displayName.trim().replace(/'/g, "''")}'`)
    }
    if (body.description !== undefined) {
      updates.push(body.description === null
        ? 'description = NULL'
        : `description = '${body.description.replace(/'/g, "''")}'`
      )
    }
    if (body.color !== undefined) {
      updates.push(`color = '${body.color}'`)
    }
    if (body.icon !== undefined) {
      updates.push(`icon = '${body.icon}'`)
    }
    if (body.priority !== undefined) {
      updates.push(`priority = ${body.priority}`)
    }

    updates.push('updated_at = NOW()')

    // Execute update
    await prisma.$executeRawUnsafe(`
      UPDATE "${tenant}".core_rbac_groups
      SET ${updates.join(', ')}
      WHERE id = '${groupId.replace(/'/g, "''")}'
    `)

    // Fetch updated group
    const updatedGroups = await prisma.$queryRawUnsafe<GroupRow[]>(`
      SELECT * FROM "${tenant}".core_rbac_groups WHERE id = '${groupId.replace(/'/g, "''")}'
    `)

    if (updatedGroups.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch updated group' },
        { status: 500 }
      )
    }

    const row = updatedGroups[0]

    // Get role count
    const roleCountResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*) as count FROM "${tenant}".core_rbac_roles WHERE group_id = '${groupId.replace(/'/g, "''")}'
    `)
    const roleCount = Number(roleCountResult[0]?.count || 0)

    const group: RoleGroup = {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      color: row.color,
      icon: row.icon as RoleIcon,
      priority: row.priority,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      roleCount
    }

    return NextResponse.json({
      message: 'Group updated successfully',
      data: group
    })
  } catch (error) {
    console.error('rbac group PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// DELETE - Delete a group
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, groupId } = await params

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

    // Check if group exists
    const existingGroups = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_rbac_groups WHERE id = '${groupId.replace(/'/g, "''")}'
    `)

    if (existingGroups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if group has roles assigned
    const roleCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*) as count FROM "${tenant}".core_rbac_roles WHERE group_id = '${groupId.replace(/'/g, "''")}'
    `)

    if (Number(roleCount[0]?.count || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group with assigned roles. Remove roles from this group first.' },
        { status: 400 }
      )
    }

    // Delete the group (cascade will remove permissions)
    await prisma.$executeRawUnsafe(`
      DELETE FROM "${tenant}".core_rbac_groups WHERE id = '${groupId.replace(/'/g, "''")}'
    `)

    return NextResponse.json({
      message: 'Group deleted successfully'
    })
  } catch (error) {
    console.error('rbac group DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
