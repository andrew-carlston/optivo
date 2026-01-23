# useFindDomain Hook

Manages state and API interactions for the find-domain feature.

## Import

```typescript
import { useFindDomain } from '@/app/(marketing)/find-domain/hooks/useFindDomain'
```

## Return Value

```typescript
interface UseFindDomainReturn {
  // Input state
  slug: string
  handleSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  normalizedSlug: string

  // Search state
  isSearching: boolean
  canSearch: boolean
  handleSearch: (e?: React.FormEvent | React.MouseEvent) => Promise<void>

  // Result state
  tenant: TenantResult | null
  isFound: boolean
  notFound: boolean

  // Navigation
  handleContinue: () => void
  handleClear: () => void

  // Error state
  error: string | null

  // UI helpers
  buttonText: string
}
```

## Types

```typescript
interface TenantResult {
  id: string
  name: string
  slug: string
  logo?: string
  tagline?: string
}
```

## Usage

### Basic Usage

```tsx
'use client'

import { useFindDomain } from './hooks/useFindDomain'

export default function FindDomainPage() {
  const {
    slug,
    handleSlugChange,
    handleSearch,
    canSearch,
    buttonText,
  } = useFindDomain()

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={slug}
        onChange={handleSlugChange}
        placeholder="acme-corp"
      />
      <button type="submit" disabled={!canSearch}>
        {buttonText}
      </button>
    </form>
  )
}
```

### With Error Handling

```tsx
'use client'

import { useFindDomain } from './hooks/useFindDomain'
import { TenantPreview } from './components'

export default function FindDomainPage() {
  const {
    slug,
    handleSlugChange,
    handleSearch,
    canSearch,
    isFound,
    tenant,
    notFound,
    error,
    buttonText,
  } = useFindDomain()

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={slug}
        onChange={handleSlugChange}
        placeholder="acme-corp"
        aria-describedby={error ? 'error-message' : undefined}
        aria-invalid={!!error || notFound}
      />

      {isFound && tenant && (
        <TenantPreview
          name={tenant.name}
          slug={tenant.slug}
          logo={tenant.logo}
          tagline={tenant.tagline}
        />
      )}

      {notFound && (
        <p className="error">
          No company exists with the slug "{slug}". Please check the spelling.
        </p>
      )}

      {error && (
        <p id="error-message" role="alert" className="error">
          {error}
        </p>
      )}

      <button type="submit" disabled={!canSearch && !isFound}>
        {buttonText}
      </button>
    </form>
  )
}
```

## State Details

### Input State

| Property | Type | Description |
|----------|------|-------------|
| `slug` | `string` | The current normalized slug value |
| `normalizedSlug` | `string` | Computed normalized slug (same as `slug`) |
| `handleSlugChange` | `function` | Input change handler that normalizes input |

**Slug Normalization**:
- Converts to lowercase
- Trims whitespace
- Replaces spaces with hyphens
- Removes invalid characters (only allows `a-z`, `0-9`, `-`)
- Collapses multiple consecutive hyphens
- Removes leading/trailing hyphens

### Search State

| Property | Type | Description |
|----------|------|-------------|
| `isSearching` | `boolean` | True while API request is in flight |
| `canSearch` | `boolean` | True when slug is valid and not currently searching |
| `handleSearch` | `function` | Triggers search or navigation (if already found) |

**handleSearch Behavior**:
1. If `canSearch` is false, does nothing
2. If tenant is already found, navigates to `/{slug}/sign-in`
3. Otherwise, makes API request to `/api/find-domain`

### Result State

| Property | Type | Description |
|----------|------|-------------|
| `tenant` | `TenantResult \| null` | Found tenant data |
| `isFound` | `boolean` | True when `tenant` is not null |
| `notFound` | `boolean` | True when search returned no results |

### Navigation

| Property | Type | Description |
|----------|------|-------------|
| `handleContinue` | `function` | Navigates to `/{tenant.slug}/sign-in` |
| `handleClear` | `function` | Resets all state to initial values |

### Error State

| Property | Type | Description |
|----------|------|-------------|
| `error` | `string \| null` | Error message from failed requests |

### UI Helpers

| Property | Type | Description |
|----------|------|-------------|
| `buttonText` | `string` | Dynamic button label based on current state |

**buttonText Values**:
- `"Searching..."` - While `isSearching` is true
- `"Continue to {tenant.name}"` - When tenant is found
- `"Find Company"` - Default state

## State Flow

```
Initial State
     │
     ▼
[User types slug]
     │
     ├── handleSlugChange normalizes input
     ├── Clears tenant, notFound, error
     │
     ▼
[User submits form]
     │
     ├── handleSearch called
     ├── If already found → redirect to sign-in
     │
     ▼
[API Request]
     │
     ├── isSearching = true
     │
     ▼
[API Response]
     │
     ├── Success → tenant set, isFound = true
     ├── 404 → notFound = true
     └── Error → error message set
```

## Dependencies

- `useState` - React state management
- `useCallback` - Memoized handlers
- `useRouter` - Next.js navigation

## Source File

`src/app/(marketing)/find-domain/hooks/useFindDomain.ts`

## Related

- [Find Domain Feature](/docs/features/find-domain.md)
- [Find Domain API](/docs/api/find-domain.md)
- [TenantPreview Component](/docs/components/TenantPreview.md)
