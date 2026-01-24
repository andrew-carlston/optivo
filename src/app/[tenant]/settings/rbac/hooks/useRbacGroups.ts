'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  RoleGroup,
  CreateGroupRequest,
  UpdateGroupRequest,
  RoleIcon
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface ApiGroupResponse {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string
  icon: RoleIcon
  priority: number
  createdAt: string
  updatedAt: string
  roleCount?: number
}

interface GroupsApiResponse {
  data?: ApiGroupResponse[]
  error?: string
}

interface GroupApiResponse {
  data?: ApiGroupResponse
  message?: string
  error?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useRbacGroups() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [groups, setGroups] = useState<RoleGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // API: Load groups
  // ---------------------------------------------------------------------------
  const loadGroups = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/groups`)
      const result = (await response.json()) as GroupsApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load groups')
      }

      const transformedGroups: RoleGroup[] = (result.data || []).map((group) => ({
        id: group.id,
        name: group.name,
        displayName: group.displayName,
        description: group.description,
        color: group.color,
        icon: group.icon,
        priority: group.priority,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        roleCount: group.roleCount
      }))

      setGroups(transformedGroups)
    } catch (err) {
      console.error('Load groups error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // EFFECT: Load groups on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // ---------------------------------------------------------------------------
  // API: Create group
  // ---------------------------------------------------------------------------
  const createGroup = useCallback(async (data: CreateGroupRequest): Promise<RoleGroup | null> => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = (await response.json()) as GroupApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create group')
      }

      if (result.data) {
        const newGroup: RoleGroup = {
          id: result.data.id,
          name: result.data.name,
          displayName: result.data.displayName,
          description: result.data.description,
          color: result.data.color,
          icon: result.data.icon,
          priority: result.data.priority,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
          roleCount: result.data.roleCount
        }

        setGroups(prev => [...prev, newGroup].sort((a, b) => b.priority - a.priority))
        return newGroup
      }

      return null
    } catch (err) {
      console.error('Create group error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create group')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // API: Update group
  // ---------------------------------------------------------------------------
  const updateGroup = useCallback(async (groupId: string, data: UpdateGroupRequest): Promise<RoleGroup | null> => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = (await response.json()) as GroupApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update group')
      }

      if (result.data) {
        const updatedGroup: RoleGroup = {
          id: result.data.id,
          name: result.data.name,
          displayName: result.data.displayName,
          description: result.data.description,
          color: result.data.color,
          icon: result.data.icon,
          priority: result.data.priority,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
          roleCount: result.data.roleCount
        }

        setGroups(prev =>
          prev.map(g => g.id === groupId ? updatedGroup : g)
            .sort((a, b) => b.priority - a.priority)
        )
        return updatedGroup
      }

      return null
    } catch (err) {
      console.error('Update group error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update group')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // API: Delete group
  // ---------------------------------------------------------------------------
  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/groups/${groupId}`, {
        method: 'DELETE'
      })

      const result = (await response.json()) as GroupApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete group')
      }

      setGroups(prev => prev.filter(g => g.id !== groupId))
      return true
    } catch (err) {
      console.error('Delete group error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete group')
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // HELPER: Get group by ID
  // ---------------------------------------------------------------------------
  const getGroupById = useCallback((groupId: string): RoleGroup | undefined => {
    return groups.find(g => g.id === groupId)
  }, [groups])

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  return {
    groups,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isSaving: isCreating || isUpdating,
    error,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById
  }
}

export type UseRbacGroupsReturn = ReturnType<typeof useRbacGroups>
