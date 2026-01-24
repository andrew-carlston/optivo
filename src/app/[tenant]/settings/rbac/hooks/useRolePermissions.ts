'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Role,
  RolePermissions,
  UpdateRoleRequest,
  UpdatePermissionsRequest,
  DataScope,
  ScopeType,
  PagePermissions,
  TablePermissions,
  TagPermissions,
  LabelPermissions,
  RoleIcon,
  DEFAULT_PERMISSIONS,
  DEFAULT_PAGE_PERMISSIONS,
  DEFAULT_TABLE_PERMISSIONS,
  DEFAULT_DATA_SCOPE,
  DEFAULT_TAG_PERMISSIONS,
  DEFAULT_LABEL_PERMISSIONS,
} from '@/types/rbac'

// ============================================================================
// API Response Types (snake_case from server)
// ============================================================================

interface ApiRole {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  icon: string
  is_system_role: boolean
  is_default: boolean
  group_id: string | null
  parent_role_id: string | null
  priority: number
  created_at: string
  updated_at: string
}

interface ApiPermissionsSnakeCase {
  id: string
  role_id: string
  page_permissions: PagePermissions | null
  table_permissions: TablePermissions | null
  data_scope: DataScope | null
  tag_permissions: TagPermissions | null
  label_permissions: LabelPermissions | null
  cascade_to_children: boolean
  inherit_from_parent: boolean
  created_at: string
  updated_at: string
}

interface RoleDetailApiResponse {
  data?: {
    role: ApiRole
    permissions: ApiPermissionsSnakeCase | null
  }
  error?: string
}

// Permissions API returns camelCase (already transformed by server)
interface PermissionsApiResponse {
  data?: RolePermissions
  error?: string
}

interface RoleUpdateApiResponse {
  message?: string
  data?: ApiRole
  error?: string
}

// ============================================================================
// Types
// ============================================================================

interface FormErrors {
  general?: string
  displayName?: string
  permissions?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useRolePermissions(roleId: string | null) {
  const params = useParams()
  const tenantSlug = params.tenant as string

  // ---------------------------------------------------------------------------
  // STATE: Loading & UI
  // ---------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveSuccess, setSaveSuccess] = useState(false)
  // Refresh counter to force re-fetching data when needed
  const [refreshCounter, setRefreshCounter] = useState(0)

  // ---------------------------------------------------------------------------
  // STATE: Role Data
  // ---------------------------------------------------------------------------
  const [role, setRole] = useState<Role | null>(null)
  const [originalRole, setOriginalRole] = useState<Role | null>(null)

  // ---------------------------------------------------------------------------
  // STATE: Role Form Fields
  // ---------------------------------------------------------------------------
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [icon, setIcon] = useState<RoleIcon>('user')
  const [isDefault, setIsDefault] = useState(false)
  const [parentRoleId, setParentRoleId] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [priority, setPriority] = useState(0)

  // ---------------------------------------------------------------------------
  // STATE: Permissions Data
  // ---------------------------------------------------------------------------
  const [permissions, setPermissions] = useState<RolePermissions | null>(null)
  const [originalPermissions, setOriginalPermissions] = useState<RolePermissions | null>(null)

  // ---------------------------------------------------------------------------
  // STATE: Parent Role Data (for permission ceiling enforcement)
  // ---------------------------------------------------------------------------
  const [parentRole, setParentRole] = useState<Role | null>(null)
  const [parentPermissions, setParentPermissions] = useState<RolePermissions | null>(null)

  // ---------------------------------------------------------------------------
  // STATE: Page Permissions
  // ---------------------------------------------------------------------------
  const [pagePermissions, setPagePermissions] = useState<PagePermissions>(
    DEFAULT_PERMISSIONS.pagePermissions
  )

  // ---------------------------------------------------------------------------
  // STATE: Table Permissions
  // ---------------------------------------------------------------------------
  const [tablePermissions, setTablePermissions] = useState<TablePermissions>(
    DEFAULT_PERMISSIONS.tablePermissions
  )

  // ---------------------------------------------------------------------------
  // STATE: Data Scope
  // ---------------------------------------------------------------------------
  const [dataScope, setDataScope] = useState<DataScope>(DEFAULT_PERMISSIONS.dataScope)

  // ---------------------------------------------------------------------------
  // STATE: Tag & Label Permissions
  // ---------------------------------------------------------------------------
  const [tagPermissions, setTagPermissions] = useState<TagPermissions>(
    DEFAULT_PERMISSIONS.tagPermissions!
  )
  const [labelPermissions, setLabelPermissions] = useState<LabelPermissions>(
    DEFAULT_PERMISSIONS.labelPermissions!
  )

  // ---------------------------------------------------------------------------
  // STATE: Inheritance Settings
  // ---------------------------------------------------------------------------
  const [cascadeToChildren, setCascadeToChildren] = useState(true)
  const [inheritFromParent, setInheritFromParent] = useState(true)

  // ---------------------------------------------------------------------------
  // COMPUTED: Check if role details have unsaved changes
  // ---------------------------------------------------------------------------
  const hasRoleChanges = useMemo(() => {
    if (!originalRole) return false

    return (
      displayName !== originalRole.displayName ||
      description !== (originalRole.description || '') ||
      color !== originalRole.color ||
      icon !== originalRole.icon ||
      isDefault !== originalRole.isDefault ||
      parentRoleId !== originalRole.parentRoleId ||
      groupId !== (originalRole.groupId || null) ||
      priority !== originalRole.priority
    )
  }, [originalRole, displayName, description, color, icon, isDefault, parentRoleId, groupId, priority])

  // ---------------------------------------------------------------------------
  // COMPUTED: Check if permissions have unsaved changes
  // ---------------------------------------------------------------------------
  const hasPermissionsChanges = useMemo(() => {
    if (!originalPermissions) return false

    return (
      JSON.stringify(pagePermissions) !== JSON.stringify(originalPermissions.pagePermissions) ||
      JSON.stringify(tablePermissions) !== JSON.stringify(originalPermissions.tablePermissions) ||
      JSON.stringify(dataScope) !== JSON.stringify(originalPermissions.dataScope) ||
      JSON.stringify(tagPermissions) !== JSON.stringify(originalPermissions.tagPermissions) ||
      JSON.stringify(labelPermissions) !== JSON.stringify(originalPermissions.labelPermissions) ||
      cascadeToChildren !== originalPermissions.cascadeToChildren ||
      inheritFromParent !== originalPermissions.inheritFromParent
    )
  }, [
    originalPermissions,
    pagePermissions,
    tablePermissions,
    dataScope,
    tagPermissions,
    labelPermissions,
    cascadeToChildren,
    inheritFromParent,
  ])

  // ---------------------------------------------------------------------------
  // COMPUTED: Combined changes check
  // ---------------------------------------------------------------------------
  const hasChanges = hasRoleChanges || hasPermissionsChanges

  // ---------------------------------------------------------------------------
  // COMPUTED: Is this a system role (read-only)
  // ---------------------------------------------------------------------------
  const isSystemRole = role?.isSystemRole ?? false

  // ---------------------------------------------------------------------------
  // API: Load role with permissions
  // ---------------------------------------------------------------------------
  const loadRole = useCallback(async () => {
    if (!roleId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Fetch role details with permissions (single endpoint returns both)
      const roleResponse = await fetch(`/api/${tenantSlug}/rbac/${roleId}`)

      if (!roleResponse.ok) {
        const errorResult = await roleResponse.json().catch(() => ({}))
        throw new Error(errorResult.error || 'Failed to load role')
      }

      const result = (await roleResponse.json()) as RoleDetailApiResponse

      if (!result.data?.role) {
        throw new Error('Role not found')
      }

      const apiRole = result.data.role
      const apiPermissions: ApiPermissionsSnakeCase | null = result.data.permissions

      // Transform snake_case API response to camelCase for UI
      const transformedRole: Role = {
        id: apiRole.id,
        name: apiRole.name,
        displayName: apiRole.display_name,
        description: apiRole.description,
        color: apiRole.color,
        icon: apiRole.icon as RoleIcon,
        isSystemRole: apiRole.is_system_role,
        isDefault: apiRole.is_default,
        groupId: apiRole.group_id,
        parentRoleId: apiRole.parent_role_id,
        priority: apiRole.priority,
        createdBy: null,
        createdAt: apiRole.created_at,
        updatedAt: apiRole.updated_at,
      }

      // Set role state
      setRole(transformedRole)
      setOriginalRole(transformedRole)
      setDisplayName(transformedRole.displayName)
      setDescription(transformedRole.description || '')
      setColor(transformedRole.color)
      setIcon(transformedRole.icon)
      setIsDefault(transformedRole.isDefault)
      setParentRoleId(transformedRole.parentRoleId)
      setGroupId(transformedRole.groupId || null)
      setPriority(transformedRole.priority)

      // Transform and set permissions (use defaults if not present)
      if (apiPermissions) {
        const transformedPermissions: RolePermissions = {
          id: apiPermissions.id,
          roleId: apiPermissions.role_id,
          pagePermissions: apiPermissions.page_permissions || DEFAULT_PAGE_PERMISSIONS,
          tablePermissions: apiPermissions.table_permissions || DEFAULT_TABLE_PERMISSIONS,
          dataScope: apiPermissions.data_scope || DEFAULT_DATA_SCOPE,
          tagPermissions: apiPermissions.tag_permissions || DEFAULT_TAG_PERMISSIONS,
          labelPermissions: apiPermissions.label_permissions || DEFAULT_LABEL_PERMISSIONS,
          // Extract tags from tagPermissions.visibleTags for the UI
          tags: apiPermissions.tag_permissions?.visibleTags || [],
          cascadeToChildren: apiPermissions.cascade_to_children,
          inheritFromParent: apiPermissions.inherit_from_parent,
          createdAt: apiPermissions.created_at,
          updatedAt: apiPermissions.updated_at,
        }

        setPermissions(transformedPermissions)
        setOriginalPermissions(transformedPermissions)
        setPagePermissions(transformedPermissions.pagePermissions)
        setTablePermissions(transformedPermissions.tablePermissions)
        setDataScope(transformedPermissions.dataScope)
        setTagPermissions(transformedPermissions.tagPermissions || DEFAULT_PERMISSIONS.tagPermissions!)
        setLabelPermissions(transformedPermissions.labelPermissions || DEFAULT_PERMISSIONS.labelPermissions!)
        setCascadeToChildren(transformedPermissions.cascadeToChildren)
        setInheritFromParent(transformedPermissions.inheritFromParent)
      } else {
        // No permissions record exists yet - use defaults
        const defaultPerms: RolePermissions = {
          id: '',
          roleId: roleId,
          pagePermissions: DEFAULT_PAGE_PERMISSIONS,
          tablePermissions: DEFAULT_TABLE_PERMISSIONS,
          dataScope: DEFAULT_DATA_SCOPE,
          tagPermissions: DEFAULT_TAG_PERMISSIONS,
          labelPermissions: DEFAULT_LABEL_PERMISSIONS,
          tags: [], // No tags by default
          cascadeToChildren: true,
          inheritFromParent: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setPermissions(defaultPerms)
        setOriginalPermissions(defaultPerms)
        setPagePermissions(defaultPerms.pagePermissions)
        setTablePermissions(defaultPerms.tablePermissions)
        setDataScope(defaultPerms.dataScope)
        setTagPermissions(defaultPerms.tagPermissions!)
        setLabelPermissions(defaultPerms.labelPermissions!)
        setCascadeToChildren(defaultPerms.cascadeToChildren)
        setInheritFromParent(defaultPerms.inheritFromParent)
      }

      // Fetch parent role if this role has a parent
      // Always fetch fresh parent data (bypass cache) to ensure we have the latest parent permissions
      // This is critical for enforcing permission ceilings when parent scope changes
      if (transformedRole.parentRoleId) {
        try {
          const parentResponse = await fetch(`/api/${tenantSlug}/rbac/${transformedRole.parentRoleId}?_t=${Date.now()}`)

          if (parentResponse.ok) {
            const parentResult = (await parentResponse.json()) as RoleDetailApiResponse

            if (parentResult.data?.role) {
              const apiParentRole = parentResult.data.role
              const apiParentPermissions = parentResult.data.permissions

              // Transform parent role
              const transformedParentRole: Role = {
                id: apiParentRole.id,
                name: apiParentRole.name,
                displayName: apiParentRole.display_name,
                description: apiParentRole.description,
                color: apiParentRole.color,
                icon: apiParentRole.icon as RoleIcon,
                isSystemRole: apiParentRole.is_system_role,
                isDefault: apiParentRole.is_default,
                groupId: apiParentRole.group_id,
                parentRoleId: apiParentRole.parent_role_id,
                priority: apiParentRole.priority,
                createdBy: null,
                createdAt: apiParentRole.created_at,
                updatedAt: apiParentRole.updated_at,
              }
              setParentRole(transformedParentRole)

              // Transform parent permissions
              if (apiParentPermissions) {
                const transformedParentPermissions: RolePermissions = {
                  id: apiParentPermissions.id,
                  roleId: apiParentPermissions.role_id,
                  pagePermissions: apiParentPermissions.page_permissions || DEFAULT_PAGE_PERMISSIONS,
                  tablePermissions: apiParentPermissions.table_permissions || DEFAULT_TABLE_PERMISSIONS,
                  dataScope: apiParentPermissions.data_scope || DEFAULT_DATA_SCOPE,
                  tagPermissions: apiParentPermissions.tag_permissions || DEFAULT_TAG_PERMISSIONS,
                  labelPermissions: apiParentPermissions.label_permissions || DEFAULT_LABEL_PERMISSIONS,
                  cascadeToChildren: apiParentPermissions.cascade_to_children,
                  inheritFromParent: apiParentPermissions.inherit_from_parent,
                  createdAt: apiParentPermissions.created_at,
                  updatedAt: apiParentPermissions.updated_at,
                }
                setParentPermissions(transformedParentPermissions)
              } else {
                setParentPermissions(null)
              }
            }
          }
        } catch (parentError) {
          // Log but don't fail the main load if parent fetch fails
          console.error('Failed to load parent role:', parentError)
          setParentRole(null)
          setParentPermissions(null)
        }
      } else {
        // No parent role - clear parent state
        setParentRole(null)
        setParentPermissions(null)
      }
    } catch (error) {
      console.error('Load role error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to load role',
      })
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug, roleId, refreshCounter])

  // ---------------------------------------------------------------------------
  // EFFECT: Clear parent state when roleId changes to prevent stale data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // When roleId changes, immediately clear parent data to prevent stale
    // parent permissions from being used before the new data loads
    setParentRole(null)
    setParentPermissions(null)
  }, [roleId])

  // ---------------------------------------------------------------------------
  // EFFECT: Load role on mount or roleId change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadRole()
  }, [loadRole])

  // ---------------------------------------------------------------------------
  // HANDLER: Validate role form
  // ---------------------------------------------------------------------------
  const validateRoleForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [displayName])

  // ---------------------------------------------------------------------------
  // HANDLER: Save role details
  // ---------------------------------------------------------------------------
  const handleSaveRole = useCallback(async () => {
    if (isSavingRole || !roleId || isSystemRole) return
    if (!validateRoleForm()) return

    setIsSavingRole(true)
    setErrors({})
    setSaveSuccess(false)

    try {
      const payload: UpdateRoleRequest & { groupId?: string | null } = {
        displayName: displayName.trim(),
        description: description.trim() || null,
        color,
        icon,
        isDefault,
        parentRoleId,
        groupId,
        priority,
      }

      const response = await fetch(`/api/${tenantSlug}/rbac/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as RoleUpdateApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save role')
      }

      // Update original state to match saved state (transform snake_case response)
      if (result.data) {
        const apiRole = result.data
        const transformedRole: Role = {
          id: apiRole.id,
          name: apiRole.name,
          displayName: apiRole.display_name,
          description: apiRole.description,
          color: apiRole.color,
          icon: apiRole.icon as RoleIcon,
          isSystemRole: apiRole.is_system_role,
          isDefault: apiRole.is_default,
          groupId: apiRole.group_id,
          parentRoleId: apiRole.parent_role_id,
          priority: apiRole.priority,
          createdBy: null,
          createdAt: apiRole.created_at,
          updatedAt: apiRole.updated_at,
        }
        setRole(transformedRole)
        setOriginalRole(transformedRole)
      }

      setSaveSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Save role error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save role',
      })
    } finally {
      setIsSavingRole(false)
    }
  }, [
    tenantSlug,
    roleId,
    displayName,
    description,
    color,
    icon,
    isDefault,
    parentRoleId,
    groupId,
    priority,
    isSavingRole,
    isSystemRole,
    validateRoleForm,
  ])

  // ---------------------------------------------------------------------------
  // HANDLER: Save permissions
  // ---------------------------------------------------------------------------
  const handleSavePermissions = useCallback(async () => {
    if (isSavingPermissions || !roleId || isSystemRole) return

    setIsSavingPermissions(true)
    setErrors({})
    setSaveSuccess(false)

    try {
      const payload: UpdatePermissionsRequest = {
        pagePermissions,
        tablePermissions,
        dataScope,
        tagPermissions,
        labelPermissions,
        cascadeToChildren,
        inheritFromParent,
      }

      const response = await fetch(`/api/${tenantSlug}/rbac/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as PermissionsApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save permissions')
      }

      // Update original state to match saved state
      if (result.data) {
        setPermissions(result.data)
        setOriginalPermissions(result.data)
      }

      setSaveSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Save permissions error:', error)
      setErrors({
        permissions: error instanceof Error ? error.message : 'Failed to save permissions',
      })
    } finally {
      setIsSavingPermissions(false)
    }
  }, [
    tenantSlug,
    roleId,
    pagePermissions,
    tablePermissions,
    dataScope,
    tagPermissions,
    labelPermissions,
    cascadeToChildren,
    inheritFromParent,
    isSavingPermissions,
    isSystemRole,
  ])

  // ---------------------------------------------------------------------------
  // HANDLER: Save all changes (role + permissions)
  // ---------------------------------------------------------------------------
  const handleSaveAll = useCallback(async () => {
    if (hasRoleChanges) {
      await handleSaveRole()
    }
    if (hasPermissionsChanges) {
      await handleSavePermissions()
    }
  }, [hasRoleChanges, hasPermissionsChanges, handleSaveRole, handleSavePermissions])

  // ---------------------------------------------------------------------------
  // HANDLER: Discard role changes
  // ---------------------------------------------------------------------------
  const handleDiscardRoleChanges = useCallback(() => {
    if (originalRole) {
      setDisplayName(originalRole.displayName)
      setDescription(originalRole.description || '')
      setColor(originalRole.color)
      setIcon(originalRole.icon)
      setIsDefault(originalRole.isDefault)
      setParentRoleId(originalRole.parentRoleId)
      setGroupId(originalRole.groupId || null)
      setPriority(originalRole.priority)
    }
  }, [originalRole])

  // ---------------------------------------------------------------------------
  // HANDLER: Discard permissions changes
  // ---------------------------------------------------------------------------
  const handleDiscardPermissionsChanges = useCallback(() => {
    if (originalPermissions) {
      setPagePermissions(originalPermissions.pagePermissions)
      setTablePermissions(originalPermissions.tablePermissions)
      setDataScope(originalPermissions.dataScope)
      setTagPermissions(originalPermissions.tagPermissions || DEFAULT_PERMISSIONS.tagPermissions!)
      setLabelPermissions(originalPermissions.labelPermissions || DEFAULT_PERMISSIONS.labelPermissions!)
      setCascadeToChildren(originalPermissions.cascadeToChildren)
      setInheritFromParent(originalPermissions.inheritFromParent)
    }
  }, [originalPermissions])

  // ---------------------------------------------------------------------------
  // HANDLER: Discard all changes
  // ---------------------------------------------------------------------------
  const handleDiscardChanges = useCallback(() => {
    handleDiscardRoleChanges()
    handleDiscardPermissionsChanges()
  }, [handleDiscardRoleChanges, handleDiscardPermissionsChanges])

  // ---------------------------------------------------------------------------
  // HANDLER: Update page permission
  // ---------------------------------------------------------------------------
  const updatePageAccess = useCallback((pageName: string, access: boolean) => {
    setPagePermissions((prev) => ({
      ...prev,
      [pageName]: {
        ...prev[pageName],
        access,
      },
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Update page view permission
  // ---------------------------------------------------------------------------
  const updatePageView = useCallback((pageName: string, viewName: string, enabled: boolean) => {
    setPagePermissions((prev) => ({
      ...prev,
      [pageName]: {
        ...prev[pageName],
        views: {
          ...prev[pageName]?.views,
          [viewName]: enabled,
        },
      },
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Update table visibility
  // ---------------------------------------------------------------------------
  const updateTableVisible = useCallback((tableName: string, visible: boolean) => {
    setTablePermissions((prev) => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        visible,
      },
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Update table column permission
  // ---------------------------------------------------------------------------
  const updateTableColumn = useCallback(
    (tableName: string, columnName: string, visible: boolean) => {
      setTablePermissions((prev) => ({
        ...prev,
        [tableName]: {
          ...prev[tableName],
          columns: {
            ...prev[tableName]?.columns,
            [columnName]: visible,
          },
        },
      }))
    },
    []
  )

  // ---------------------------------------------------------------------------
  // HANDLER: Update data scope type
  // ---------------------------------------------------------------------------
  const updateScopeType = useCallback((scopeType: ScopeType) => {
    setDataScope((prev) => ({
      ...prev,
      scopeType,
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Update data scope option
  // ---------------------------------------------------------------------------
  const updateScopeOption = useCallback(
    <K extends keyof Omit<DataScope, 'scopeType'>>(key: K, value: DataScope[K]) => {
      setDataScope((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  // ---------------------------------------------------------------------------
  // HANDLER: Update tag permission
  // ---------------------------------------------------------------------------
  const updateTagPermission = useCallback(
    <K extends keyof TagPermissions>(key: K, value: TagPermissions[K]) => {
      setTagPermissions((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  // ---------------------------------------------------------------------------
  // HANDLER: Update label permission
  // ---------------------------------------------------------------------------
  const updateLabelPermission = useCallback(
    <K extends keyof LabelPermissions>(key: K, value: LabelPermissions[K]) => {
      setLabelPermissions((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  // ---------------------------------------------------------------------------
  // HANDLER: Refresh parent permissions
  // ---------------------------------------------------------------------------
  // This function fetches fresh parent permissions data.
  // Call this when you need to ensure the parent scope ceiling is up-to-date,
  // e.g., after navigating back to a child role from a parent role edit.
  const refreshParentPermissions = useCallback(async () => {
    if (!parentRoleId) {
      setParentRole(null)
      setParentPermissions(null)
      return
    }

    try {
      // Always bypass cache to get fresh data
      const parentResponse = await fetch(`/api/${tenantSlug}/rbac/${parentRoleId}?_t=${Date.now()}`)

      if (parentResponse.ok) {
        const parentResult = (await parentResponse.json()) as RoleDetailApiResponse

        if (parentResult.data?.role) {
          const apiParentRole = parentResult.data.role
          const apiParentPermissions = parentResult.data.permissions

          // Transform parent role
          const transformedParentRole: Role = {
            id: apiParentRole.id,
            name: apiParentRole.name,
            displayName: apiParentRole.display_name,
            description: apiParentRole.description,
            color: apiParentRole.color,
            icon: apiParentRole.icon as RoleIcon,
            isSystemRole: apiParentRole.is_system_role,
            isDefault: apiParentRole.is_default,
            groupId: apiParentRole.group_id,
            parentRoleId: apiParentRole.parent_role_id,
            priority: apiParentRole.priority,
            createdBy: null,
            createdAt: apiParentRole.created_at,
            updatedAt: apiParentRole.updated_at,
          }
          setParentRole(transformedParentRole)

          // Transform parent permissions
          if (apiParentPermissions) {
            const transformedParentPermissions: RolePermissions = {
              id: apiParentPermissions.id,
              roleId: apiParentPermissions.role_id,
              pagePermissions: apiParentPermissions.page_permissions || DEFAULT_PAGE_PERMISSIONS,
              tablePermissions: apiParentPermissions.table_permissions || DEFAULT_TABLE_PERMISSIONS,
              dataScope: apiParentPermissions.data_scope || DEFAULT_DATA_SCOPE,
              tagPermissions: apiParentPermissions.tag_permissions || DEFAULT_TAG_PERMISSIONS,
              labelPermissions: apiParentPermissions.label_permissions || DEFAULT_LABEL_PERMISSIONS,
              cascadeToChildren: apiParentPermissions.cascade_to_children,
              inheritFromParent: apiParentPermissions.inherit_from_parent,
              createdAt: apiParentPermissions.created_at,
              updatedAt: apiParentPermissions.updated_at,
            }
            setParentPermissions(transformedParentPermissions)
          } else {
            setParentPermissions(null)
          }
        }
      }
    } catch (parentError) {
      console.error('Failed to refresh parent permissions:', parentError)
    }
  }, [tenantSlug, parentRoleId])

  // ---------------------------------------------------------------------------
  // HANDLER: Force refresh all role data
  // ---------------------------------------------------------------------------
  // This triggers a full re-fetch of the role and its parent permissions.
  // Use this when you need to ensure all data is fresh, e.g., after navigating
  // back to a child role from editing its parent.
  const forceRefresh = useCallback(() => {
    setRefreshCounter((prev) => prev + 1)
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Clear errors
  // ---------------------------------------------------------------------------
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  return {
    // Loading & UI state
    isLoading,
    isSavingRole,
    isSavingPermissions,
    isSaving: isSavingRole || isSavingPermissions,
    errors,
    saveSuccess,
    hasChanges,
    hasRoleChanges,
    hasPermissionsChanges,
    isSystemRole,

    // Role data
    role,
    permissions,

    // Parent role data (for permission ceiling enforcement)
    parentRole,
    parentPermissions,

    // Role form fields
    displayName,
    description,
    color,
    icon,
    isDefault,
    parentRoleId,
    groupId,
    priority,

    // Role form setters
    setDisplayName,
    setDescription,
    setColor,
    setIcon,
    setIsDefault,
    setParentRoleId,
    setGroupId,
    setPriority,

    // Permissions state
    pagePermissions,
    tablePermissions,
    dataScope,
    tagPermissions,
    labelPermissions,
    cascadeToChildren,
    inheritFromParent,

    // Permissions setters
    setCascadeToChildren,
    setInheritFromParent,

    // Permission update handlers
    updatePageAccess,
    updatePageView,
    updateTableVisible,
    updateTableColumn,
    updateScopeType,
    updateScopeOption,
    updateTagPermission,
    updateLabelPermission,

    // Actions
    loadRole,
    forceRefresh,
    refreshParentPermissions,
    handleSaveRole,
    handleSavePermissions,
    handleSaveAll,
    handleDiscardRoleChanges,
    handleDiscardPermissionsChanges,
    handleDiscardChanges,
    clearErrors,
  }
}

export type UseRolePermissionsReturn = ReturnType<typeof useRolePermissions>
