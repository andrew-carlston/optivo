import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'
import {
  RbacRoleRow,
  RbacPermissionsRow,
  RbacPermissions,
  UpdatePermissionsRequest,
  PagePermissions,
  TablePermissions,
  TagPermissions,
  LabelPermissions,
  DataScope,
  VALID_SCOPE_TYPES,
  ScopeType,
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

function isValidUuid(id: string): boolean {
  return /^[a-f0-9-]{36}$/.test(id) || /^[a-f0-9]{32}$/.test(id) || id.length > 0
}

function validatePagePermissions(perms: unknown): string | null {
  if (typeof perms !== 'object' || perms === null) {
    return 'pagePermissions must be an object'
  }

  const pagePerms = perms as Record<string, unknown>

  for (const [pageName, pageConfig] of Object.entries(pagePerms)) {
    if (typeof pageConfig !== 'object' || pageConfig === null) {
      return `pagePermissions.${pageName} must be an object`
    }

    const config = pageConfig as Record<string, unknown>

    if (typeof config.access !== 'boolean') {
      return `pagePermissions.${pageName}.access must be a boolean`
    }

    if (config.views !== undefined) {
      if (typeof config.views !== 'object' || config.views === null) {
        return `pagePermissions.${pageName}.views must be an object`
      }

      const views = config.views as Record<string, unknown>
      for (const [viewName, viewAccess] of Object.entries(views)) {
        if (typeof viewAccess !== 'boolean') {
          return `pagePermissions.${pageName}.views.${viewName} must be a boolean`
        }
      }
    }
  }

  return null
}

function validateTablePermissions(perms: unknown): string | null {
  if (typeof perms !== 'object' || perms === null) {
    return 'tablePermissions must be an object'
  }

  const tablePerms = perms as Record<string, unknown>

  for (const [tableName, tableConfig] of Object.entries(tablePerms)) {
    if (typeof tableConfig !== 'object' || tableConfig === null) {
      return `tablePermissions.${tableName} must be an object`
    }

    const config = tableConfig as Record<string, unknown>

    if (typeof config.visible !== 'boolean') {
      return `tablePermissions.${tableName}.visible must be a boolean`
    }

    if (config.columns !== undefined) {
      if (typeof config.columns !== 'object' || config.columns === null) {
        return `tablePermissions.${tableName}.columns must be an object`
      }

      const columns = config.columns as Record<string, unknown>
      for (const [colName, colVisible] of Object.entries(columns)) {
        if (typeof colVisible !== 'boolean') {
          return `tablePermissions.${tableName}.columns.${colName} must be a boolean`
        }
      }
    }
  }

  return null
}

function validateTagPermissions(perms: unknown): string | null {
  if (typeof perms !== 'object' || perms === null) {
    return 'tagPermissions must be an object'
  }

  const tagPerms = perms as Record<string, unknown>

  if (tagPerms.canCreateTags !== undefined && typeof tagPerms.canCreateTags !== 'boolean') {
    return 'tagPermissions.canCreateTags must be a boolean'
  }

  if (tagPerms.canEditTags !== undefined && typeof tagPerms.canEditTags !== 'boolean') {
    return 'tagPermissions.canEditTags must be a boolean'
  }

  if (tagPerms.canDeleteTags !== undefined && typeof tagPerms.canDeleteTags !== 'boolean') {
    return 'tagPermissions.canDeleteTags must be a boolean'
  }

  if (tagPerms.visibleTags !== undefined && tagPerms.visibleTags !== null) {
    if (!Array.isArray(tagPerms.visibleTags)) {
      return 'tagPermissions.visibleTags must be an array or null'
    }
    for (const tag of tagPerms.visibleTags) {
      if (typeof tag !== 'string') {
        return 'tagPermissions.visibleTags must contain only strings'
      }
    }
  }

  if (tagPerms.editableTags !== undefined && tagPerms.editableTags !== null) {
    if (!Array.isArray(tagPerms.editableTags)) {
      return 'tagPermissions.editableTags must be an array or null'
    }
    for (const tag of tagPerms.editableTags) {
      if (typeof tag !== 'string') {
        return 'tagPermissions.editableTags must contain only strings'
      }
    }
  }

  return null
}

function validateLabelPermissions(perms: unknown): string | null {
  if (typeof perms !== 'object' || perms === null) {
    return 'labelPermissions must be an object'
  }

  const labelPerms = perms as Record<string, unknown>

  if (labelPerms.canCreateLabels !== undefined && typeof labelPerms.canCreateLabels !== 'boolean') {
    return 'labelPermissions.canCreateLabels must be a boolean'
  }

  if (labelPerms.canEditLabels !== undefined && typeof labelPerms.canEditLabels !== 'boolean') {
    return 'labelPermissions.canEditLabels must be a boolean'
  }

  if (labelPerms.canDeleteLabels !== undefined && typeof labelPerms.canDeleteLabels !== 'boolean') {
    return 'labelPermissions.canDeleteLabels must be a boolean'
  }

  if (labelPerms.visibleLabels !== undefined && labelPerms.visibleLabels !== null) {
    if (!Array.isArray(labelPerms.visibleLabels)) {
      return 'labelPermissions.visibleLabels must be an array or null'
    }
    for (const label of labelPerms.visibleLabels) {
      if (typeof label !== 'string') {
        return 'labelPermissions.visibleLabels must contain only strings'
      }
    }
  }

  if (labelPerms.editableLabels !== undefined && labelPerms.editableLabels !== null) {
    if (!Array.isArray(labelPerms.editableLabels)) {
      return 'labelPermissions.editableLabels must be an array or null'
    }
    for (const label of labelPerms.editableLabels) {
      if (typeof label !== 'string') {
        return 'labelPermissions.editableLabels must contain only strings'
      }
    }
  }

  return null
}

function validateDataScope(scope: unknown): string | null {
  if (typeof scope !== 'object' || scope === null) {
    return 'dataScope must be an object'
  }

  const dataScope = scope as Record<string, unknown>

  if (dataScope.scopeType !== undefined && !VALID_SCOPE_TYPES.includes(dataScope.scopeType as ScopeType)) {
    return `dataScope.scopeType must be one of: ${VALID_SCOPE_TYPES.join(', ')}`
  }

  if (dataScope.includeIndirectReports !== undefined && typeof dataScope.includeIndirectReports !== 'boolean') {
    return 'dataScope.includeIndirectReports must be a boolean'
  }

  if (dataScope.includeCrossDepartment !== undefined && typeof dataScope.includeCrossDepartment !== 'boolean') {
    return 'dataScope.includeCrossDepartment must be a boolean'
  }

  if (dataScope.excludeTerminated !== undefined && typeof dataScope.excludeTerminated !== 'boolean') {
    return 'dataScope.excludeTerminated must be a boolean'
  }

  return null
}

// ============================================================================
// GET - Get role permissions
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

    // Verify role exists
    const escapedRoleId = roleId.replace(/'/g, "''")
    const roleRecords = await prisma.$queryRawUnsafe<RbacRoleRow[]>(`
      SELECT id FROM "${tenant}".core_rbac_roles WHERE id = '${escapedRoleId}' LIMIT 1
    `)

    if (roleRecords.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

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
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      )
    }

    // Return defaults if no permissions record exists (snake_case for frontend transformation)
    if (permissionsRecords.length === 0) {
      return NextResponse.json({
        data: {
          id: null,
          role_id: roleId,
          page_permissions: DEFAULT_PAGE_PERMISSIONS,
          table_permissions: DEFAULT_TABLE_PERMISSIONS,
          data_scope: DEFAULT_DATA_SCOPE,
          tag_permissions: DEFAULT_TAG_PERMISSIONS,
          label_permissions: DEFAULT_LABEL_PERMISSIONS,
          cascade_to_children: true,
          inherit_from_parent: true,
          created_at: null,
          updated_at: null
        }
      })
    }

    const permRow = permissionsRecords[0]

    // Return snake_case for frontend transformation
    const permissions: RbacPermissions = {
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

    return NextResponse.json({ data: permissions })
  } catch (error) {
    console.error('rbac/[roleId]/permissions GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// PUT - Update role permissions
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant, roleId } = await params
    const body: UpdatePermissionsRequest = await request.json()

    console.log('[RBAC Permissions PUT] Received request:', { tenant, roleId, body: JSON.stringify(body).slice(0, 200) + '...' })

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

    // Verify role exists and check if system role
    const escapedRoleId = roleId.replace(/'/g, "''")
    const query = `SELECT id, is_system_role FROM "${tenant}".core_rbac_roles WHERE id = '${escapedRoleId}' LIMIT 1`
    console.log('[RBAC Permissions PUT] Executing query:', query)

    const roleRecords = await prisma.$queryRawUnsafe<RbacRoleRow[]>(query)
    console.log('[RBAC Permissions PUT] Query result count:', roleRecords.length)

    if (roleRecords.length === 0) {
      console.log('[RBAC Permissions PUT] Role not found for ID:', roleId, 'in schema:', tenant)
      return NextResponse.json(
        { error: `Role not found: ID=${roleId} in tenant=${tenant}` },
        { status: 404 }
      )
    }

    // Prevent updates to system role permissions
    if (roleRecords[0].is_system_role) {
      return NextResponse.json(
        { error: 'Cannot modify permissions for system roles' },
        { status: 403 }
      )
    }

    // Validate input fields
    if (body.pagePermissions !== undefined) {
      const pageError = validatePagePermissions(body.pagePermissions)
      if (pageError) {
        return NextResponse.json({ error: pageError }, { status: 400 })
      }
    }

    if (body.tablePermissions !== undefined) {
      const tableError = validateTablePermissions(body.tablePermissions)
      if (tableError) {
        return NextResponse.json({ error: tableError }, { status: 400 })
      }
    }

    if (body.tagPermissions !== undefined) {
      const tagError = validateTagPermissions(body.tagPermissions)
      if (tagError) {
        return NextResponse.json({ error: tagError }, { status: 400 })
      }
    }

    if (body.labelPermissions !== undefined) {
      const labelError = validateLabelPermissions(body.labelPermissions)
      if (labelError) {
        return NextResponse.json({ error: labelError }, { status: 400 })
      }
    }

    if (body.dataScope !== undefined) {
      const scopeError = validateDataScope(body.dataScope)
      if (scopeError) {
        return NextResponse.json({ error: scopeError }, { status: 400 })
      }
    }

    if (body.cascadeToChildren !== undefined && typeof body.cascadeToChildren !== 'boolean') {
      return NextResponse.json(
        { error: 'cascadeToChildren must be a boolean' },
        { status: 400 }
      )
    }

    if (body.inheritFromParent !== undefined && typeof body.inheritFromParent !== 'boolean') {
      return NextResponse.json(
        { error: 'inheritFromParent must be a boolean' },
        { status: 400 }
      )
    }

    // Check if permissions record exists
    const existingPerms = await prisma.$queryRawUnsafe<RbacPermissionsRow[]>(`
      SELECT * FROM "${tenant}".core_rbac_permissions WHERE role_id = '${escapedRoleId}' LIMIT 1
    `)

    // Prepare JSON values
    const pagePermsJson = body.pagePermissions
      ? JSON.stringify(body.pagePermissions as PagePermissions).replace(/'/g, "''")
      : null
    const tablePermsJson = body.tablePermissions
      ? JSON.stringify(body.tablePermissions as TablePermissions).replace(/'/g, "''")
      : null
    const dataScopeJson = body.dataScope
      ? JSON.stringify(body.dataScope as DataScope).replace(/'/g, "''")
      : null
    const tagPermsJson = body.tagPermissions
      ? JSON.stringify(body.tagPermissions as TagPermissions).replace(/'/g, "''")
      : null
    const labelPermsJson = body.labelPermissions
      ? JSON.stringify(body.labelPermissions as LabelPermissions).replace(/'/g, "''")
      : null

    if (existingPerms.length > 0) {
      // Update existing record
      const updateClauses: string[] = []

      if (pagePermsJson !== null) {
        updateClauses.push(`page_permissions = '${pagePermsJson}'::jsonb`)
      }
      if (tablePermsJson !== null) {
        updateClauses.push(`table_permissions = '${tablePermsJson}'::jsonb`)
      }
      if (dataScopeJson !== null) {
        // Merge with existing data_scope for partial updates
        const existingScope = existingPerms[0].data_scope || DEFAULT_DATA_SCOPE
        const mergedScope = { ...existingScope, ...(body.dataScope as Partial<DataScope>) }
        const mergedScopeJson = JSON.stringify(mergedScope).replace(/'/g, "''")
        updateClauses.push(`data_scope = '${mergedScopeJson}'::jsonb`)
      }
      if (tagPermsJson !== null) {
        // Merge with existing tag_permissions for partial updates
        const existingTags = existingPerms[0].tag_permissions || DEFAULT_TAG_PERMISSIONS
        const mergedTags = { ...existingTags, ...(body.tagPermissions as Partial<TagPermissions>) }
        const mergedTagsJson = JSON.stringify(mergedTags).replace(/'/g, "''")
        updateClauses.push(`tag_permissions = '${mergedTagsJson}'::jsonb`)
      }
      if (labelPermsJson !== null) {
        // Merge with existing label_permissions for partial updates
        const existingLabels = existingPerms[0].label_permissions || DEFAULT_LABEL_PERMISSIONS
        const mergedLabels = { ...existingLabels, ...(body.labelPermissions as Partial<LabelPermissions>) }
        const mergedLabelsJson = JSON.stringify(mergedLabels).replace(/'/g, "''")
        updateClauses.push(`label_permissions = '${mergedLabelsJson}'::jsonb`)
      }
      if (body.cascadeToChildren !== undefined) {
        updateClauses.push(`cascade_to_children = ${body.cascadeToChildren}`)
      }
      if (body.inheritFromParent !== undefined) {
        updateClauses.push(`inherit_from_parent = ${body.inheritFromParent}`)
      }

      if (updateClauses.length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        )
      }

      updateClauses.push('updated_at = NOW()')

      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_rbac_permissions
        SET ${updateClauses.join(', ')}
        WHERE role_id = '${escapedRoleId}'
      `)
    } else {
      // Insert new permissions record with provided values or defaults
      const insertPagePerms = pagePermsJson
        ? `'${pagePermsJson}'::jsonb`
        : `'${JSON.stringify(DEFAULT_PAGE_PERMISSIONS).replace(/'/g, "''")}'::jsonb`
      const insertTablePerms = tablePermsJson
        ? `'${tablePermsJson}'::jsonb`
        : `'${JSON.stringify(DEFAULT_TABLE_PERMISSIONS).replace(/'/g, "''")}'::jsonb`
      const insertDataScope = dataScopeJson
        ? `'${dataScopeJson}'::jsonb`
        : `'${JSON.stringify(DEFAULT_DATA_SCOPE).replace(/'/g, "''")}'::jsonb`
      const insertTagPerms = tagPermsJson
        ? `'${tagPermsJson}'::jsonb`
        : `'${JSON.stringify(DEFAULT_TAG_PERMISSIONS).replace(/'/g, "''")}'::jsonb`
      const insertLabelPerms = labelPermsJson
        ? `'${labelPermsJson}'::jsonb`
        : `'${JSON.stringify(DEFAULT_LABEL_PERMISSIONS).replace(/'/g, "''")}'::jsonb`
      const insertCascade = body.cascadeToChildren ?? true
      const insertInherit = body.inheritFromParent ?? true

      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenant}".core_rbac_permissions (
          role_id, page_permissions, table_permissions, data_scope, tag_permissions, label_permissions,
          cascade_to_children, inherit_from_parent
        ) VALUES (
          '${escapedRoleId}',
          ${insertPagePerms},
          ${insertTablePerms},
          ${insertDataScope},
          ${insertTagPerms},
          ${insertLabelPerms},
          ${insertCascade},
          ${insertInherit}
        )
      `)
    }

    // Fetch and return updated permissions
    const updatedRecords = await prisma.$queryRawUnsafe<RbacPermissionsRow[]>(`
      SELECT
        id, role_id, page_permissions, table_permissions,
        data_scope, tag_permissions, label_permissions,
        cascade_to_children, inherit_from_parent,
        created_at, updated_at
      FROM "${tenant}".core_rbac_permissions
      WHERE role_id = '${escapedRoleId}'
      LIMIT 1
    `)

    if (updatedRecords.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated permissions' },
        { status: 500 }
      )
    }

    const permRow = updatedRecords[0]

    // Return snake_case for frontend transformation
    const permissions: RbacPermissions = {
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

    return NextResponse.json({
      message: 'Permissions updated successfully',
      data: permissions
    })
  } catch (error) {
    console.error('rbac/[roleId]/permissions PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
