import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFindDomain } from './useFindDomain'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('useFindDomain', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const { result } = renderHook(() => useFindDomain())

      expect(result.current.slug).toBe('')
      expect(result.current.isSearching).toBe(false)
      expect(result.current.tenant).toBeNull()
      expect(result.current.notFound).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.canSearch).toBe(false)
      expect(result.current.isFound).toBe(false)
      expect(result.current.buttonText).toBe('Find Company')
    })
  })

  describe('slug input handling', () => {
    it('normalizes slug input to lowercase', () => {
      const { result } = renderHook(() => useFindDomain())

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'ACME-Corp' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.slug).toBe('acme-corp')
    })

    it('removes invalid characters from slug', () => {
      const { result } = renderHook(() => useFindDomain())

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme@corp!123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.slug).toBe('acmecorp123')
    })

    it('replaces spaces with hyphens', () => {
      const { result } = renderHook(() => useFindDomain())

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme corp inc' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.slug).toBe('acme-corp-inc')
    })

    it('enables search when slug is entered', () => {
      const { result } = renderHook(() => useFindDomain())

      expect(result.current.canSearch).toBe(false)

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.canSearch).toBe(true)
    })

    it('clears previous results when typing', () => {
      const { result } = renderHook(() => useFindDomain())

      // Simulate a found tenant
      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Mock successful search
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          tenant: { name: 'Acme Corp', slug: 'acme', logo: null },
        }),
      })

      // Perform search
      act(() => {
        result.current.handleSearch()
      })

      // Wait for result, then type again
      waitFor(() => {
        expect(result.current.tenant).not.toBeNull()
      }).then(() => {
        act(() => {
          result.current.handleSlugChange({
            target: { value: 'other' },
          } as React.ChangeEvent<HTMLInputElement>)
        })

        expect(result.current.tenant).toBeNull()
        expect(result.current.notFound).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('search functionality', () => {
    it('calls API with normalized slug', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          tenant: { name: 'Acme Corp', slug: 'acme-corp', logo: null },
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme-corp' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(fetch).toHaveBeenCalledWith('/api/find-domain?slug=acme-corp')
    })

    it('sets tenant when found (found: true) and auto-redirects', async () => {
      const { result } = renderHook(() => useFindDomain())

      const mockTenant = { name: 'Acme Corp', slug: 'acme-corp', logo: '/logo.png' }

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          tenant: mockTenant,
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme-corp' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.tenant).toEqual(mockTenant)
      expect(result.current.isFound).toBe(true)
      expect(result.current.notFound).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isRedirecting).toBe(true)
      expect(result.current.buttonText).toBe('Redirecting...')
      expect(mockPush).toHaveBeenCalledWith('/acme-corp/sign-in')
    })

    it('sets notFound when API returns found: false with "Company not found" error', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: false,
          error: 'Company not found',
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'nonexistent' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.tenant).toBeNull()
      expect(result.current.isFound).toBe(false)
      expect(result.current.notFound).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('sets error when API returns found: false with other error', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: false,
          error: 'Invalid domain format. Use only lowercase letters, numbers, and hyphens.',
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.tenant).toBeNull()
      expect(result.current.notFound).toBe(false)
      expect(result.current.error).toBe('Invalid domain format. Use only lowercase letters, numbers, and hyphens.')
    })

    it('handles network errors', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockRejectedValueOnce(new Error('Network error'))

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.tenant).toBeNull()
    })

    it('shows loading state during search', async () => {
      const { result } = renderHook(() => useFindDomain())

      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(fetch as Mock).mockReturnValueOnce(promise)

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSearch()
      })

      expect(result.current.isSearching).toBe(true)
      expect(result.current.buttonText).toBe('Searching...')

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ found: false, error: 'Company not found' }),
        })
      })

      expect(result.current.isSearching).toBe(false)
    })
  })

  describe('navigation', () => {
    it('redirects to sign-in page when handleContinue is called with found tenant', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          tenant: { name: 'Acme Corp', slug: 'acme-corp', logo: null },
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme-corp' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      act(() => {
        result.current.handleContinue()
      })

      expect(mockPush).toHaveBeenCalledWith('/acme-corp/sign-in')
    })

    it('auto-redirects immediately when tenant is found', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          tenant: { name: 'Acme Corp', slug: 'acme-corp', logo: null },
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme-corp' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      // Auto-redirect should have been triggered
      expect(result.current.isRedirecting).toBe(true)
      expect(mockPush).toHaveBeenCalledWith('/acme-corp/sign-in')
    })
  })

  describe('clear functionality', () => {
    it('clears all state when handleClear is called', async () => {
      const { result } = renderHook(() => useFindDomain())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          tenant: { name: 'Acme Corp', slug: 'acme-corp', logo: null },
        }),
      })

      act(() => {
        result.current.handleSlugChange({
          target: { value: 'acme-corp' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.tenant).not.toBeNull()

      act(() => {
        result.current.handleClear()
      })

      expect(result.current.slug).toBe('')
      expect(result.current.tenant).toBeNull()
      expect(result.current.notFound).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})
