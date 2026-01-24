import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RbacRoleWithCountRow,
  RbacRoleWithMemberCount,
  CreateRoleRequest,
  VALID_ROLE_ICONS,
  RoleIcon,
  DEFAULT_PAGE_PERMISSIONS,
  DEFAULT_TABLE_PERMISSIONS,
  DEFAULT_TAG_PERMISSIONS,
  DEFAULT_LABEL_PERMISSIONS,
  DEFAULT_DATA_SCOPE,
  SUPER_ADMIN_PAGE_PERMISSIONS,
  SUPER_ADMIN_TABLE_PERMISSIONS,
  SUPER_ADMIN_TAG_PERMISSIONS,
  SUPER_ADMIN_LABEL_PERMISSIONS,
  SUPER_ADMIN_DATA_SCOPE,
  generateRoleSlug
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

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

// ============================================================================
// Helper - Ensure RBAC tables exist
// ============================================================================

async function ensureRbacTables(prisma: ReturnType<typeof createMainPrismaClient>, tenant: string): Promise<void> {
  try {
    // Create core_rbac_groups table first (referenced by roles)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tenant}".core_rbac_groups (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6b7280',
        icon TEXT DEFAULT 'briefcase',
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create core_rbac_roles table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tenant}".core_rbac_roles (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6b7280',
        icon TEXT DEFAULT 'shield',
        is_system_role BOOLEAN DEFAULT FALSE,
        is_default BOOLEAN DEFAULT FALSE,
        group_id TEXT REFERENCES "${tenant}".core_rbac_groups(id) ON DELETE SET NULL,
        parent_role_id TEXT REFERENCES "${tenant}".core_rbac_roles(id) ON DELETE SET NULL,
        priority INTEGER DEFAULT 0,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Add group_id column if it doesn't exist (for existing tables)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${tenant}'
          AND table_name = 'core_rbac_roles'
          AND column_name = 'group_id'
        ) THEN
          ALTER TABLE "${tenant}".core_rbac_roles
          ADD COLUMN group_id TEXT REFERENCES "${tenant}".core_rbac_groups(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `)

    // Create core_rbac_permissions table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tenant}".core_rbac_permissions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        role_id TEXT NOT NULL REFERENCES "${tenant}".core_rbac_roles(id) ON DELETE CASCADE,
        page_permissions JSONB DEFAULT '{}',
        table_permissions JSONB DEFAULT '{}',
        data_scope JSONB DEFAULT '{}',
        tag_permissions JSONB DEFAULT '{}',
        label_permissions JSONB DEFAULT '{}',
        cascade_to_children BOOLEAN DEFAULT TRUE,
        inherit_from_parent BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(role_id)
      )
    `)

    // Create core_rbac_group_permissions table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tenant}".core_rbac_group_permissions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        group_id TEXT NOT NULL REFERENCES "${tenant}".core_rbac_groups(id) ON DELETE CASCADE,
        page_permissions JSONB DEFAULT '{}',
        table_permissions JSONB DEFAULT '{}',
        data_scope JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id)
      )
    `)
  } catch (error) {
    console.log('Note: Could not create RBAC tables (may already exist):', error)
  }
}

// ============================================================================
// Helper - Seed Super Admin role if not exists
// ============================================================================

async function ensureSuperAdminRole(prisma: ReturnType<typeof createMainPrismaClient>, tenant: string): Promise<void> {
  try {
    // Check if super_admin exists
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_rbac_roles WHERE name = 'super_admin' LIMIT 1
    `)

    if (existing.length === 0) {
      // Create Super Admin role
      const roleResult = await prisma.$queryRawUnsafe<{ id: string }[]>(`
        INSERT INTO "${tenant}".core_rbac_roles (
          name, display_name, description, color, icon, is_system_role, is_default, priority
        ) VALUES (
          'super_admin',
          'Super Admin',
          'Full access to all features and data. Cannot be deleted or modified.',
          '#7c3aed',
          'crown',
          TRUE,
          FALSE,
          1000
        )
        RETURNING id
      `)

      if (roleResult.length > 0) {
        const roleId = roleResult[0].id

        // Create Super Admin permissions
        const pagePermsJson = JSON.stringify(SUPER_ADMIN_PAGE_PERMISSIONS).replace(/'/g, "''")
        const tablePermsJson = JSON.stringify(SUPER_ADMIN_TABLE_PERMISSIONS).replace(/'/g, "''")
        const dataScopeJson = JSON.stringify(SUPER_ADMIN_DATA_SCOPE).replace(/'/g, "''")
        const tagPermsJson = JSON.stringify(SUPER_ADMIN_TAG_PERMISSIONS).replace(/'/g, "''")
        const labelPermsJson = JSON.stringify(SUPER_ADMIN_LABEL_PERMISSIONS).replace(/'/g, "''")

        await prisma.$executeRawUnsafe(`
          INSERT INTO "${tenant}".core_rbac_permissions (
            role_id, page_permissions, table_permissions, data_scope, tag_permissions, label_permissions,
            cascade_to_children, inherit_from_parent
          ) VALUES (
            '${roleId}',
            '${pagePermsJson}'::jsonb,
            '${tablePermsJson}'::jsonb,
            '${dataScopeJson}'::jsonb,
            '${tagPermsJson}'::jsonb,
            '${labelPermsJson}'::jsonb,
            FALSE,
            FALSE
          )
        `)
      }
    }
  } catch (error) {
    console.log('Note: Could not seed Super Admin role:', error)
  }
}

// ============================================================================
// GET - List all roles with member counts
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    // Verify tenant exists in main database
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenant }
    })

    if (!tenantRecord) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Ensure tables exist
    await ensureRbacTables(prisma, tenant)
    await ensureSuperAdminRole(prisma, tenant)

    // Query roles with member count and tags from permissions
    let roleRecords: (RbacRoleWithCountRow & { group_id: string | null; tags: string[] | null })[] = []
    try {
      roleRecords = await prisma.$queryRawUnsafe<(RbacRoleWithCountRow & { group_id: string | null; tags: string[] | null })[]>(`
        SELECT
          r.id,
          r.name,
          r.display_name,
          r.description,
          r.color,
          r.icon,
          r.is_system_role,
          r.is_default,
          r.group_id,
          r.parent_role_id,
          r.priority,
          r.created_by,
          r.created_at,
          r.updated_at,
          COALESCE(
            (SELECT COUNT(*) FROM "${tenant}".core_directory d WHERE d.role = r.name),
            0
          ) as member_count,
          (SELECT p.tag_permissions->'visibleTags' FROM "${tenant}".core_rbac_permissions p WHERE p.role_id = r.id) as tags
        FROM "${tenant}".core_rbac_roles r
        ORDER BY r.priority DESC, r.display_name ASC
      `)
    } catch (queryError) {
      console.error('Could not query RBAC roles:', queryError)
      return NextResponse.json(
        { error: 'Failed to query roles' },
        { status: 500 }
      )
    }

    // Transform to API response format
    const roles = roleRecords.map(row => ({
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      is_system_role: row.is_system_role,
      is_default: row.is_default,
      group_id: row.group_id,
      parent_role_id: row.parent_role_id,
      priority: row.priority,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      member_count: Number(row.member_count),
      tags: Array.isArray(row.tags) ? row.tags : []
    }))

    return NextResponse.json({ data: roles })
  } catch (error) {
    console.error('rbac GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// POST - Create a new role
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: CreateRoleRequest = await request.json()

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
    const name = body.name ? body.name.trim() : generateRoleSlug(displayName)
    if (!name) {
      return NextResponse.json(
        { error: 'Could not generate valid role name from displayName' },
        { status: 400 }
      )
    }

    // Validate name format
    if (!/^[a-z0-9_]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Role name can only contain lowercase letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description must be a string' },
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

    if (body.priority !== undefined) {
      if (typeof body.priority !== 'number' || body.priority < 0 || body.priority > 999) {
        return NextResponse.json(
          { error: 'priority must be a number between 0 and 999' },
          { status: 400 }
        )
      }
    }

    // Ensure tables exist
    await ensureRbacTables(prisma, tenant)

    // Check for duplicate name
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_rbac_roles WHERE name = '${name.replace(/'/g, "''")}'
    `)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 409 }
      )
    }

    // Validate parentRoleId if provided
    if (body.parentRoleId) {
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

    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_rbac_roles SET is_default = FALSE WHERE is_default = TRUE
      `)
    }

    // Escape values for SQL
    const escapedDisplayName = displayName.replace(/'/g, "''")
    const escapedName = name.replace(/'/g, "''")
    const escapedDescription = body.description ? body.description.replace(/'/g, "''") : null
    const color = body.color || '#6b7280'
    const icon = body.icon || 'shield'
    const priority = body.priority ?? 0
    const isDefault = body.isDefault ?? false
    const groupId = body.groupId ? `'${body.groupId.replace(/'/g, "''")}'` : 'NULL'
    const parentRoleId = body.parentRoleId ? `'${body.parentRoleId.replace(/'/g, "''")}'` : 'NULL'

    // Insert the role
    const roleResult = await prisma.$queryRawUnsafe<{ id: string; created_at: Date; updated_at: Date }[]>(`
      INSERT INTO "${tenant}".core_rbac_roles (
        name, display_name, description, color, icon, is_system_role, is_default, group_id, parent_role_id, priority
      ) VALUES (
        '${escapedName}',
        '${escapedDisplayName}',
        ${escapedDescription ? `'${escapedDescription}'` : 'NULL'},
        '${color}',
        '${icon}',
        FALSE,
        ${isDefault},
        ${groupId},
        ${parentRoleId},
        ${priority}
      )
      RETURNING id, created_at, updated_at
    `)

    if (roleResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      )
    }

    const newRole = roleResult[0]

    // Create default permissions for the new role
    const pagePermsJson = JSON.stringify(DEFAULT_PAGE_PERMISSIONS).replace(/'/g, "''")
    const tablePermsJson = JSON.stringify(DEFAULT_TABLE_PERMISSIONS).replace(/'/g, "''")
    const dataScopeJson = JSON.stringify(DEFAULT_DATA_SCOPE).replace(/'/g, "''")
    const tagPermsJson = JSON.stringify(DEFAULT_TAG_PERMISSIONS).replace(/'/g, "''")
    const labelPermsJson = JSON.stringify(DEFAULT_LABEL_PERMISSIONS).replace(/'/g, "''")

    await prisma.$executeRawUnsafe(`
      INSERT INTO "${tenant}".core_rbac_permissions (
        role_id, page_permissions, table_permissions, data_scope, tag_permissions, label_permissions,
        cascade_to_children, inherit_from_parent
      ) VALUES (
        '${newRole.id}',
        '${pagePermsJson}'::jsonb,
        '${tablePermsJson}'::jsonb,
        '${dataScopeJson}'::jsonb,
        '${tagPermsJson}'::jsonb,
        '${labelPermsJson}'::jsonb,
        TRUE,
        ${body.parentRoleId ? 'TRUE' : 'FALSE'}
      )
    `)

    // Return the created role
    return NextResponse.json({
      message: 'Role created successfully',
      data: {
        id: newRole.id,
        name: name,
        display_name: displayName,
        description: body.description || null,
        color: color,
        icon: icon,
        is_system_role: false,
        is_default: isDefault,
        group_id: body.groupId || null,
        parent_role_id: body.parentRoleId || null,
        priority: priority,
        created_at: newRole.created_at.toISOString(),
        updated_at: newRole.updated_at.toISOString(),
        member_count: 0
      }
    }, { status: 201 })
  } catch (error) {
    console.error('rbac POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
