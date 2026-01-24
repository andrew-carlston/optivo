'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Role,
  CreateRoleRequest,
  RbacRoleWithMemberCount,
  RoleIcon,
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface FormErrors {
  general?: string
  name?: string
  displayName?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useRbacRoles() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  // ---------------------------------------------------------------------------
  // STATE: Loading & UI
  // ---------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // ---------------------------------------------------------------------------
  // STATE: Roles Data
  // ---------------------------------------------------------------------------
  const [roles, setRoles] = useState<Role[]>([])

  // ---------------------------------------------------------------------------
  // STATE: Create Role Form
  // ---------------------------------------------------------------------------
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // API: Load all roles
  // ---------------------------------------------------------------------------
  const loadRoles = useCallback(async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac`)

      if (!response.ok) {
        throw new Error('Failed to load roles')
      }

      const { data } = (await response.json()) as { data: RbacRoleWithMemberCount[] }

      // Transform snake_case API response to camelCase for UI
      const transformedRoles: Role[] = (data || []).map((role: RbacRoleWithMemberCount & { group_id?: string | null; tags?: string[] }) => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        color: role.color,
        icon: role.icon as RoleIcon,
        isSystemRole: role.is_system_role,
        isDefault: role.is_default,
        groupId: role.group_id || null,
        parentRoleId: role.parent_role_id,
        priority: role.priority,
        createdBy: null,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
        memberCount: role.member_count,
        tags: Array.isArray(role.tags) ? role.tags : [],
      }))

      setRoles(transformedRoles)
    } catch (error) {
      console.error('Load roles error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to load roles',
      })
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // EFFECT: Load roles on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  // ---------------------------------------------------------------------------
  // HANDLER: Validate create role form
  // ---------------------------------------------------------------------------
  const validateCreateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!newRoleName.trim()) {
      newErrors.name = 'Role name is required'
    } else if (!/^[a-z][a-z0-9_]*$/.test(newRoleName)) {
      newErrors.name = 'Name must start with a letter and contain only lowercase letters, numbers, and underscores'
    } else if (roles.some((r) => r.name === newRoleName)) {
      newErrors.name = 'A role with this name already exists'
    }

    if (!newRoleDisplayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [newRoleName, newRoleDisplayName, roles])

  // ---------------------------------------------------------------------------
  // HANDLER: Create new role
  // ---------------------------------------------------------------------------
  const handleCreateRole = useCallback(async () => {
    if (isSaving) return
    if (!validateCreateForm()) return

    setIsSaving(true)
    setErrors({})
    setSaveSuccess(false)

    try {
      const payload: CreateRoleRequest = {
        name: newRoleName.trim(),
        displayName: newRoleDisplayName.trim(),
        description: newRoleDescription.trim() || null,
      }

      const response = await fetch(`/api/${tenantSlug}/rbac`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as { data?: RbacRoleWithMemberCount; error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create role')
      }

      // Add new role to the list (transform from snake_case)
      if (result.data) {
        const apiData = result.data as RbacRoleWithMemberCount & { group_id?: string | null }
        const newRole: Role = {
          id: apiData.id,
          name: apiData.name,
          displayName: apiData.display_name,
          description: apiData.description,
          color: apiData.color,
          icon: apiData.icon as RoleIcon,
          isSystemRole: apiData.is_system_role,
          isDefault: apiData.is_default,
          groupId: apiData.group_id || null,
          parentRoleId: apiData.parent_role_id,
          priority: apiData.priority,
          createdBy: null,
          createdAt: apiData.created_at,
          updatedAt: apiData.updated_at,
          memberCount: apiData.member_count,
        }
        setRoles((prev) => [...prev, newRole])
      }

      // Reset form
      setNewRoleName('')
      setNewRoleDisplayName('')
      setNewRoleDescription('')
      setIsCreateModalOpen(false)
      setSaveSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Create role error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create role',
      })
    } finally {
      setIsSaving(false)
    }
  }, [
    tenantSlug,
    newRoleName,
    newRoleDisplayName,
    newRoleDescription,
    isSaving,
    validateCreateForm,
  ])

  // ---------------------------------------------------------------------------
  // HANDLER: Delete role
  // ---------------------------------------------------------------------------
  const handleDeleteRole = useCallback(
    async (roleId: string) => {
      if (isDeleting) return

      const roleToDelete = roles.find((r) => r.id === roleId)
      if (!roleToDelete) return

      // Prevent deleting system roles
      if (roleToDelete.isSystemRole) {
        setErrors({ general: 'System roles cannot be deleted' })
        return
      }

      setIsDeleting(roleId)
      setErrors({})
      setDeleteSuccess(false)

      try {
        const response = await fetch(`/api/${tenantSlug}/rbac/${roleId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to delete role')
        }

        // Remove role from the list
        setRoles((prev) => prev.filter((r) => r.id !== roleId))
        setDeleteSuccess(true)

        // Clear success message after 3 seconds
        setTimeout(() => setDeleteSuccess(false), 3000)
      } catch (error) {
        console.error('Delete role error:', error)
        setErrors({
          general: error instanceof Error ? error.message : 'Failed to delete role',
        })
      } finally {
        setIsDeleting(null)
      }
    },
    [tenantSlug, roles, isDeleting]
  )

  // ---------------------------------------------------------------------------
  // HANDLER: Open create modal
  // ---------------------------------------------------------------------------
  const openCreateModal = useCallback(() => {
    setNewRoleName('')
    setNewRoleDisplayName('')
    setNewRoleDescription('')
    setErrors({})
    setIsCreateModalOpen(true)
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Close create modal
  // ---------------------------------------------------------------------------
  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
    setErrors({})
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
    isSaving,
    isDeleting,
    errors,
    saveSuccess,
    deleteSuccess,

    // Roles data
    roles,

    // Create role form state
    newRoleName,
    newRoleDisplayName,
    newRoleDescription,
    isCreateModalOpen,

    // Create role form setters
    setNewRoleName,
    setNewRoleDisplayName,
    setNewRoleDescription,

    // Actions
    loadRoles,
    handleCreateRole,
    handleDeleteRole,
    openCreateModal,
    closeCreateModal,
    clearErrors,
  }
}

export type UseRbacRolesReturn = ReturnType<typeof useRbacRoles>
