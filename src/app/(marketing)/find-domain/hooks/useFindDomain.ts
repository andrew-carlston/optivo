'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Tenant data returned from API
export interface TenantResult {
  id: string
  name: string
  slug: string
  logo?: string
  tagline?: string
}

// Normalize slug: lowercase, trim, replace spaces with hyphens
const normalizeSlug = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function useFindDomain() {
  const router = useRouter()

  // ============================================
  // STATE
  // ============================================

  // Search state
  const [slug, setSlug] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Result state
  const [tenant, setTenant] = useState<TenantResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const normalizedSlug = normalizeSlug(slug)
  const canSearch = normalizedSlug.length > 0 && !isSearching
  const isFound = tenant !== null

  // Button text changes based on state
  const buttonText = isRedirecting
    ? 'Redirecting...'
    : isSearching
      ? 'Searching...'
      : 'Find Company'

  // ============================================
  // EFFECTS
  // ============================================

  // Auto-redirect when tenant is found
  useEffect(() => {
    if (tenant && !isRedirecting) {
      setIsRedirecting(true)
      router.push(`/${tenant.slug}/sign-in`)
    }
  }, [tenant, isRedirecting, router])

  // ============================================
  // HANDLERS
  // ============================================

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSlug(normalizeSlug(value))
    // Clear previous results when user types
    setTenant(null)
    setNotFound(false)
    setError(null)
  }, [])

  const handleSearch = useCallback(async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()

    if (!canSearch || isRedirecting) return

    setIsSearching(true)
    setError(null)
    setNotFound(false)
    setTenant(null)

    try {
      const response = await fetch(`/api/find-domain?slug=${encodeURIComponent(normalizedSlug)}`)
      const data = await response.json()

      if (data.found && data.tenant) {
        setTenant(data.tenant)
        setNotFound(false)
      } else if (!data.found && data.error === 'Company not found') {
        setNotFound(true)
        setTenant(null)
      } else {
        setError(data.error || 'An error occurred while searching')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }, [canSearch, isRedirecting, normalizedSlug])

  const handleContinue = useCallback(() => {
    if (tenant) {
      router.push(`/${tenant.slug}/sign-in`)
    }
  }, [tenant, router])

  const handleClear = useCallback(() => {
    setSlug('')
    setTenant(null)
    setNotFound(false)
    setError(null)
  }, [])

  // ============================================
  // RETURN
  // ============================================

  return {
    // Input state
    slug,
    handleSlugChange,
    normalizedSlug,

    // Search state
    isSearching,
    canSearch,
    handleSearch,

    // Result state
    tenant,
    isFound,
    notFound,
    isRedirecting,

    // Navigation
    handleContinue,
    handleClear,

    // Error state
    error,

    // UI helpers
    buttonText,
  }
}

export type UseFindDomainReturn = ReturnType<typeof useFindDomain>
