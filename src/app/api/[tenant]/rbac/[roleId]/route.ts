import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RbacRoleRow,
  RbacPermissionsRow,
  RbacRole,
  RbacPermissions,
  UpdateRoleRequest,
  VALID_ROLE_ICONS,
  RoleIcon,
  DEFAULT_PAGE_PERMISSIONS,
  DEFAULT_TABLE_PERMISSIONS,
  DEFAULT_TAG_PERMISSIONS,
  DEFAULT_LABEL_PERMISSIONS,
  DEFAULT_DATA_SCOPE
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string; roleId: string }>
}

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

function isValidUuid(id: string): boolean {
  return /^[a-f0-9-]{36}$/.test(id) || /^[a-f0-9]{32}$/.test(id) || id.length > 0
}

// ============================================================================
// GET - Get role details with permissions
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, roleId } = await params

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    // Validate roleId
    if (!roleId || !isValidUuid(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
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

    // Fetch role
    const escapedRoleId = roleId.replace(/'/g, "''")
    let roleRecords: (RbacRoleRow & { group_id: string | null })[] = []
    try {
      roleRecords = await prisma.$queryRawUnsafe<(RbacRoleRow & { group_id: string | null })[]>(`
        SELECT
          id, name, display_name, description, color, icon,
          is_system_role, is_default, group_id, parent_role_id, priority,
          created_by, created_at, updated_at
        FROM "${tenant}".core_rbac_roles
        WHERE id = '${escapedRoleId}'
        LIMIT 1
      `)
    } catch (queryError) {
      console.error('Could not query role:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch role' },
        { status: 500 }
      )
    }

    if (roleRecords.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    const roleRow = roleRecords[0]

    // Fetch permissions
    let permissionsRecords: RbacPermissionsRow[] = []
    try {
      permissionsRecords = await prisma.$queryRawUnsafe<RbacPermissionsRow[]>(`
        SELECT
          id, role_id, page_permissions, table_permissions,
          data_scope, tag_permissions, label_permissions,
          cascade_to_children, inherit_from_parent,
          created_at, updated_at
        FROM "${tenant}".core_rbac_permissions
        WHERE role_id = '${escapedRoleId}'
        LIMIT 1
      `)
    } catch (queryError) {
      console.error('Could not query permissions:', queryError)
      // Continue without permissions - they might not exist yet
    }

    // Transform role to API response format (snake_case for frontend transformation)
    const role = {
      id: roleRow.id,
      name: roleRow.name,
      display_name: roleRow.display_name,
      description: roleRow.description,
      color: roleRow.color,
      icon: roleRow.icon,
      is_system_role: roleRow.is_system_role,
      is_default: roleRow.is_default,
      group_id: roleRow.group_id,
      parent_role_id: roleRow.parent_role_id,
      priority: roleRow.priority,
      created_at: roleRow.created_at.toISOString(),
      updated_at: roleRow.updated_at.toISOString()
    }

    // Transform permissions or use defaults
    let permissions: RbacPermissions | null = null
    if (permissionsRecords.length > 0) {
      const permRow = permissionsRecords[0]
      permissions = {
        id: permRow.id,
        role_id: permRow.role_id,
        page_permissions: permRow.page_permissions || DEFAULT_PAGE_PERMISSIONS,
        table_permissions: permRow.table_permissions || DEFAULT_TABLE_PERMISSIONS,
        data_scope: permRow.data_scope || DEFAULT_DATA_SCOPE,
        tag_permissions: permRow.tag_permissions || DEFAULT_TAG_PERMISSIONS,
        label_permissions: permRow.label_permissions || DEFAULT_LABEL_PERMISSIONS,
        cascade_to_children: permRow.cascade_to_children,
        inherit_from_parent: permRow.inherit_from_parent,
        created_at: permRow.created_at.toISOString(),
        updated_at: permRow.updated_at.toISOString()
      }
    }

    return NextResponse.json({
      data: {
        role,
        permissions
      }
    })
  } catch (error) {
    console.error('rbac/[roleId] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role details' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// PUT - Update role
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, roleId } = await params
    const body: UpdateRoleRequest = await request.json()

    console.log('[RBAC PUT] Received request:', { tenant, roleId, body })

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    // Validate roleId
    if (!roleId || !isValidUuid(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
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

    // Fetch existing role
    const escapedRoleId = roleId.replace(/'/g, "''")
    const query = `SELECT * FROM "${tenant}".core_rbac_roles WHERE id = '${escapedRoleId}' LIMIT 1`
    console.log('[RBAC PUT] Executing query:', query)

    const roleRecords = await prisma.$queryRawUnsafe<RbacRoleRow[]>(query)
    console.log('[RBAC PUT] Query result count:', roleRecords.length)

    if (roleRecords.length === 0) {
      console.log('[RBAC PUT] Role not found for ID:', roleId, 'in schema:', tenant)
      return NextResponse.json(
        { error: `Role not found: ID=${roleId} in tenant=${tenant}` },
        { status: 404 }
      )
    }

    const existingRole = roleRecords[0]

    // Prevent updates to system roles
    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'Cannot modify system roles' },
        { status: 403 }
      )
    }

    // Validate input fields
    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string') {
        return NextResponse.json(
          { error: 'displayName must be a string' },
          { status: 400 }
        )
      }
      const trimmed = body.displayName.trim()
      if (trimmed.length < 2 || trimmed.length > 100) {
        return NextResponse.json(
          { error: 'displayName must be 2-100 characters' },
          { status: 400 }
        )
      }
    }

    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description must be a string or null' },
        { status: 400 }
      )
    }

    if (body.color !== undefined) {
      if (typeof body.color !== 'string' || !isValidHexColor(body.color)) {
        return NextResponse.json(
          { error: 'color must be a valid hex color (e.g., #ffffff)' },
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

    // Validate parentRoleId if provided
    if (body.parentRoleId !== undefined && body.parentRoleId !== null) {
      // Cannot set self as parent
      if (body.parentRoleId === roleId) {
        return NextResponse.json(
          { error: 'Role cannot be its own parent' },
          { status: 400 }
        )
      }

      const parentExists = await prisma.$queryRawUnsafe<{ id: string }[]>(`
        SELECT id FROM "${tenant}".core_rbac_roles WHERE id = '${body.parentRoleId.replace(/'/g, "''")}'
      `)
      if (parentExists.length === 0) {
        return NextResponse.json(
          { error: 'Parent role not found' },
          { status: 400 }
        )
      }
    }

    // Validate groupId if provided (from extended body)
    const extendedBody = body as UpdateRoleRequest & { groupId?: string | null }
    if (extendedBody.groupId !== undefined && extendedBody.groupId !== null) {
      const groupExists = await prisma.$queryRawUnsafe<{ id: string }[]>(`
        SELECT id FROM "${tenant}".core_rbac_groups WHERE id = '${extendedBody.groupId.replace(/'/g, "''")}'
      `)
      if (groupExists.length === 0) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 400 }
        )
      }
    }

    // Build update query
    const updateClauses: string[] = []

    if (body.displayName !== undefined) {
      const escapedDisplayName = body.displayName.trim().replace(/'/g, "''")
      updateClauses.push(`display_name = '${escapedDisplayName}'`)
    }

    if (body.description !== undefined) {
      if (body.description === null) {
        updateClauses.push('description = NULL')
      } else {
        const escapedDescription = body.description.replace(/'/g, "''")
        updateClauses.push(`description = '${escapedDescription}'`)
      }
    }

    if (body.color !== undefined) {
      updateClauses.push(`color = '${body.color}'`)
    }

    if (body.icon !== undefined) {
      updateClauses.push(`icon = '${body.icon}'`)
    }

    if (body.parentRoleId !== undefined) {
      if (body.parentRoleId === null) {
        updateClauses.push('parent_role_id = NULL')
      } else {
        const escapedParentId = body.parentRoleId.replace(/'/g, "''")
        updateClauses.push(`parent_role_id = '${escapedParentId}'`)
      }
    }

    if (extendedBody.groupId !== undefined) {
      if (extendedBody.groupId === null) {
        updateClauses.push('group_id = NULL')
      } else {
        const escapedGroupId = extendedBody.groupId.replace(/'/g, "''")
        updateClauses.push(`group_id = '${escapedGroupId}'`)
      }
    }

    if (body.isDefault !== undefined) {
      if (body.isDefault) {
        // Unset other defaults first
        await prisma.$executeRawUnsafe(`
          UPDATE "${tenant}".core_rbac_roles SET is_default = FALSE WHERE is_default = TRUE
        `)
      }
      updateClauses.push(`is_default = ${body.isDefault}`)
    }

    if (updateClauses.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateClauses.push('updated_at = NOW()')

    // Execute update
    await prisma.$executeRawUnsafe(`
      UPDATE "${tenant}".core_rbac_roles
      SET ${updateClauses.join(', ')}
      WHERE id = '${escapedRoleId}'
    `)

    // Fetch updated role
    const updatedRecords = await prisma.$queryRawUnsafe<(RbacRoleRow & { group_id: string | null })[]>(`
      SELECT * FROM "${tenant}".core_rbac_roles WHERE id = '${escapedRoleId}' LIMIT 1
    `)

    if (updatedRecords.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated role' },
        { status: 500 }
      )
    }

    const updatedRole = updatedRecords[0]

    return NextResponse.json({
      message: 'Role updated successfully',
      data: {
        id: updatedRole.id,
        name: updatedRole.name,
        display_name: updatedRole.display_name,
        description: updatedRole.description,
        color: updatedRole.color,
        icon: updatedRole.icon,
        is_system_role: updatedRole.is_system_role,
        is_default: updatedRole.is_default,
        group_id: updatedRole.group_id,
        parent_role_id: updatedRole.parent_role_id,
        priority: updatedRole.priority,
        created_at: updatedRole.created_at.toISOString(),
        updated_at: updatedRole.updated_at.toISOString()
      }
    })
  } catch (error) {
    console.error('rbac/[roleId] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// DELETE - Delete role
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, roleId } = await params

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    // Validate roleId
    if (!roleId || !isValidUuid(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
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

    // Fetch existing role
    const escapedRoleId = roleId.replace(/'/g, "''")
    const roleRecords = await prisma.$queryRawUnsafe<RbacRoleRow[]>(`
      SELECT * FROM "${tenant}".core_rbac_roles WHERE id = '${escapedRoleId}' LIMIT 1
    `)

    if (roleRecords.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    const existingRole = roleRecords[0]

    // Prevent deletion of system roles
    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 403 }
      )
    }

    // Check if users are assigned to this role
    const usersWithRole = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*) as count FROM "${tenant}".core_directory WHERE role = '${existingRole.name.replace(/'/g, "''")}'
    `)

    const userCount = Number(usersWithRole[0]?.count || 0)
    if (userCount > 0) {
      // Find the default role to reassign users
      const defaultRole = await prisma.$queryRawUnsafe<{ name: string }[]>(`
        SELECT name FROM "${tenant}".core_rbac_roles WHERE is_default = TRUE LIMIT 1
      `)

      if (defaultRole.length === 0) {
        return NextResponse.json(
          { error: `Cannot delete role: ${userCount} user(s) are assigned to this role and no default role exists` },
          { status: 400 }
        )
      }

      // Reassign users to default role
      const defaultRoleName = defaultRole[0].name.replace(/'/g, "''")
      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_directory
        SET role = '${defaultRoleName}', updated_at = NOW()
        WHERE role = '${existingRole.name.replace(/'/g, "''")}'
      `)
    }

    // Delete the role (permissions cascade via FK)
    await prisma.$executeRawUnsafe(`
      DELETE FROM "${tenant}".core_rbac_roles WHERE id = '${escapedRoleId}'
    `)

    return NextResponse.json({
      message: 'Role deleted successfully',
      reassigned_users: userCount > 0 ? userCount : undefined
    })
  } catch (error) {
    console.error('rbac/[roleId] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
