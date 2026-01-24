'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { RegisteredPage, RegisteredTable } from '@/lib/rbac-registry'

// ============================================================================
// Types
// ============================================================================

interface RbacResourcesResponse {
  success: boolean
  data?: {
    pages: RegisteredPage[]
    tables: RegisteredTable[]
  }
  error?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useRbacResources() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState<RegisteredPage[]>([])
  const [tables, setTables] = useState<RegisteredTable[]>([])

  const loadResources = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/rbac/resources`)

      if (!response.ok) {
        throw new Error('Failed to load RBAC resources')
      }

      const result: RbacResourcesResponse = await response.json()

      if (result.data) {
        setPages(result.data.pages)
        setTables(result.data.tables)
      }
    } catch (err) {
      console.error('Load RBAC resources error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load resources')
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  return {
    isLoading,
    error,
    pages,
    tables,
    reload: loadResources
  }
}

export type UseRbacResourcesReturn = ReturnType<typeof useRbacResources>
