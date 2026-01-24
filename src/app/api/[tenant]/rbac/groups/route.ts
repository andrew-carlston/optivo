import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RoleGroup,
  CreateGroupRequest,
  VALID_ROLE_ICONS,
  RoleIcon,
  DEFAULT_PAGE_PERMISSIONS,
  DEFAULT_TABLE_PERMISSIONS,
  DEFAULT_DATA_SCOPE
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string }>
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
  role_count: bigint
}

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

function generateGroupSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ============================================================================
// Helper - Ensure RBAC Groups table exists
// ============================================================================

async function ensureGroupsTable(prisma: ReturnType<typeof createMainPrismaClient>, tenant: string): Promise<void> {
  try {
    // Create core_rbac_groups table
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

    // Add group_id column to core_rbac_roles if it doesn't exist
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
  } catch (error) {
    console.log('Note: Could not create RBAC groups tables:', error)
  }
}

// ============================================================================
// GET - List all groups with role counts
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

    // Ensure tables exist
    await ensureGroupsTable(prisma, tenant)

    // Query groups with role count
    let groupRecords: GroupRow[] = []
    try {
      groupRecords = await prisma.$queryRawUnsafe<GroupRow[]>(`
        SELECT
          g.id,
          g.name,
          g.display_name,
          g.description,
          g.color,
          g.icon,
          g.priority,
          g.created_at,
          g.updated_at,
          COALESCE(
            (SELECT COUNT(*) FROM "${tenant}".core_rbac_roles r WHERE r.group_id = g.id),
            0
          ) as role_count
        FROM "${tenant}".core_rbac_groups g
        ORDER BY g.priority DESC, g.display_name ASC
      `)
    } catch (queryError) {
      console.error('Could not query RBAC groups:', queryError)
      return NextResponse.json(
        { error: 'Failed to query groups' },
        { status: 500 }
      )
    }

    // Transform to API response format
    const groups: RoleGroup[] = groupRecords.map(row => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      color: row.color,
      icon: row.icon as RoleIcon,
      priority: row.priority,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      roleCount: Number(row.role_count)
    }))

    return NextResponse.json({ data: groups })
  } catch (error) {
    console.error('rbac groups GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// POST - Create a new group
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: CreateGroupRequest = await request.json()

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
    const name = body.name ? body.name.trim() : generateGroupSlug(displayName)
    if (!name) {
      return NextResponse.json(
        { error: 'Could not generate valid group name from displayName' },
        { status: 400 }
      )
    }

    // Validate name format
    if (!/^[a-z0-9_]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Group name can only contain lowercase letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Validate optional fields
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

    // Ensure tables exist
    await ensureGroupsTable(prisma, tenant)

    // Check for duplicate name
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_rbac_groups WHERE name = '${name.replace(/'/g, "''")}'
    `)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      )
    }

    // Escape values for SQL
    const escapedDisplayName = displayName.replace(/'/g, "''")
    const escapedName = name.replace(/'/g, "''")
    const escapedDescription = body.description ? body.description.replace(/'/g, "''") : null
    const color = body.color || '#6b7280'
    const icon = body.icon || 'briefcase'
    const priority = body.priority ?? 0

    // Insert the group
    const groupResult = await prisma.$queryRawUnsafe<{ id: string; created_at: Date; updated_at: Date }[]>(`
      INSERT INTO "${tenant}".core_rbac_groups (
        name, display_name, description, color, icon, priority
      ) VALUES (
        '${escapedName}',
        '${escapedDisplayName}',
        ${escapedDescription ? `'${escapedDescription}'` : 'NULL'},
        '${color}',
        '${icon}',
        ${priority}
      )
      RETURNING id, created_at, updated_at
    `)

    if (groupResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      )
    }

    const newGroup = groupResult[0]

    // Create default permissions for the new group
    const pagePermsJson = JSON.stringify(DEFAULT_PAGE_PERMISSIONS).replace(/'/g, "''")
    const tablePermsJson = JSON.stringify(DEFAULT_TABLE_PERMISSIONS).replace(/'/g, "''")
    const dataScopeJson = JSON.stringify(DEFAULT_DATA_SCOPE).replace(/'/g, "''")

    await prisma.$executeRawUnsafe(`
      INSERT INTO "${tenant}".core_rbac_group_permissions (
        group_id, page_permissions, table_permissions, data_scope
      ) VALUES (
        '${newGroup.id}',
        '${pagePermsJson}'::jsonb,
        '${tablePermsJson}'::jsonb,
        '${dataScopeJson}'::jsonb
      )
    `)

    // Return the created group
    return NextResponse.json({
      message: 'Group created successfully',
      data: {
        id: newGroup.id,
        name: name,
        displayName: displayName,
        description: body.description || null,
        color: color,
        icon: icon,
        priority: priority,
        createdAt: newGroup.created_at.toISOString(),
        updatedAt: newGroup.updated_at.toISOString(),
        roleCount: 0
      }
    }, { status: 201 })
  } catch (error) {
    console.error('rbac groups POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
