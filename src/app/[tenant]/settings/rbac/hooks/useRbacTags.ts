'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  RbacTag,
  CreateTagRequest,
  UpdateTagRequest
} from '@/types/rbac'

// ============================================================================
// Types
// ============================================================================

interface ApiTagResponse {
  id: string
  name: string
  displayName: string
  description: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

interface TagsApiResponse {
  data?: ApiTagResponse[]
  error?: string
}

interface TagApiResponse {
  data?: ApiTagResponse
  message?: string
  error?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useRbacTags() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [tags, setTags] = useState<RbacTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // API: Load tags
  // ---------------------------------------------------------------------------
  const loadTags = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/tags`)
      const result = (await response.json()) as TagsApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load tags')
      }

      const transformedTags: RbacTag[] = (result.data || []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        displayName: tag.displayName,
        description: tag.description,
        isArchived: tag.isArchived,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      }))

      setTags(transformedTags)
    } catch (err) {
      console.error('Load tags error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // EFFECT: Load tags on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadTags()
  }, [loadTags])

  // ---------------------------------------------------------------------------
  // API: Create tag
  // ---------------------------------------------------------------------------
  const createTag = useCallback(async (data: CreateTagRequest): Promise<RbacTag | null> => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = (await response.json()) as TagApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tag')
      }

      if (result.data) {
        const newTag: RbacTag = {
          id: result.data.id,
          name: result.data.name,
          displayName: result.data.displayName,
          description: result.data.description,
          isArchived: result.data.isArchived,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt
        }

        setTags(prev => [...prev, newTag].sort((a, b) => a.displayName.localeCompare(b.displayName)))
        return newTag
      }

      return null
    } catch (err) {
      console.error('Create tag error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create tag')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // API: Update tag
  // ---------------------------------------------------------------------------
  const updateTag = useCallback(async (tagId: string, data: UpdateTagRequest): Promise<RbacTag | null> => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = (await response.json()) as TagApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tag')
      }

      if (result.data) {
        const updatedTag: RbacTag = {
          id: result.data.id,
          name: result.data.name,
          displayName: result.data.displayName,
          description: result.data.description,
          isArchived: result.data.isArchived,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt
        }

        setTags(prev =>
          prev.map(t => t.id === tagId ? updatedTag : t)
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
        )
        return updatedTag
      }

      return null
    } catch (err) {
      console.error('Update tag error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update tag')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // API: Delete tag
  // ---------------------------------------------------------------------------
  const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/tags/${tagId}`, {
        method: 'DELETE'
      })

      const result = (await response.json()) as TagApiResponse

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete tag')
      }

      setTags(prev => prev.filter(t => t.id !== tagId))
      return true
    } catch (err) {
      console.error('Delete tag error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete tag')
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // HELPER: Get tag by ID
  // ---------------------------------------------------------------------------
  const getTagById = useCallback((tagId: string): RbacTag | undefined => {
    return tags.find(t => t.id === tagId)
  }, [tags])

  // ---------------------------------------------------------------------------
  // HELPER: Get tag by name
  // ---------------------------------------------------------------------------
  const getTagByName = useCallback((name: string): RbacTag | undefined => {
    return tags.find(t => t.name === name || t.displayName.toLowerCase() === name.toLowerCase())
  }, [tags])

  // ---------------------------------------------------------------------------
  // HELPER: Get active (non-archived) tags
  // ---------------------------------------------------------------------------
  const activeTags = tags.filter(t => !t.isArchived)

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  return {
    tags,
    activeTags,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isSaving: isCreating || isUpdating,
    error,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagByName
  }
}

export type UseRbacTagsReturn = ReturnType<typeof useRbacTags>
