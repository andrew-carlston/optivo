# Find Domain Feature

Allows users to look up their company by slug and navigate to their tenant's sign-in page.

## Overview

| Attribute | Details |
|-----------|---------|
| **Purpose** | Enable users to locate and access their organization's tenant |
| **Target Users** | Existing users who need to sign in to their company workspace |
| **Route** | `/(marketing)/find-domain` |
| **Dependencies** | Prisma (main database), Avatar component |

## User Flow

1. User visits `/find-domain`
2. Enters their company slug (e.g., `acme-corp`)
3. Input is auto-normalized to lowercase with valid characters only
4. Clicks "Find Company" to trigger API lookup
5. **If found**: Displays `TenantPreview` with company info; button changes to "Continue to [Company Name]"
6. **If not found**: Shows error message with option to retry
7. Clicking continue redirects to `/{slug}/sign-in`

## Pages

| Page | Path | Description |
|------|------|-------------|
| Find Domain | `/find-domain` | Main search interface for locating a tenant |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/find-domain` | Looks up tenant by slug in the database |

See [API Documentation](/docs/api/find-domain.md) for full details.

## Components

| Component | Description |
|-----------|-------------|
| `TenantPreview` | Displays found tenant information with logo, name, and success indicator |

See [Component Documentation](/docs/components/TenantPreview.md) for full details.

## State Management

The feature uses the `useFindDomain` hook for all state management and API interactions.

### Hook: `useFindDomain`

**Location**: `src/app/(marketing)/find-domain/hooks/useFindDomain.ts`

**Import**:
```typescript
import { useFindDomain } from './hooks/useFindDomain'
```

**Return Value Interface**:
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

**TenantResult Type**:
```typescript
interface TenantResult {
  id: string
  name: string
  slug: string
  logo?: string
  tagline?: string
}
```

### State Details

| State | Type | Description |
|-------|------|-------------|
| `slug` | `string` | Current input value (normalized) |
| `isSearching` | `boolean` | True while API request is in flight |
| `tenant` | `TenantResult \| null` | Found tenant data or null |
| `notFound` | `boolean` | True if search returned no results |
| `error` | `string \| null` | Error message from failed requests |

### Computed Values

| Value | Type | Description |
|-------|------|-------------|
| `normalizedSlug` | `string` | Slug with normalization applied |
| `canSearch` | `boolean` | True when slug is valid and not searching |
| `isFound` | `boolean` | True when tenant has been found |
| `buttonText` | `string` | Dynamic button label based on state |

## Usage Example

```tsx
'use client'

import { useFindDomain } from './hooks/useFindDomain'
import { TenantPreview } from './components'

export default function FindDomainPage() {
  const {
    slug,
    handleSlugChange,
    isSearching,
    canSearch,
    handleSearch,
    tenant,
    isFound,
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
      />

      {isFound && tenant && (
        <TenantPreview
          name={tenant.name}
          slug={tenant.slug}
          logo={tenant.logo}
          tagline={tenant.tagline}
        />
      )}

      {notFound && <p>Company not found</p>}
      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={!canSearch && !isFound}>
        {buttonText}
      </button>
    </form>
  )
}
```

## Types

```typescript
// Tenant data returned from API
export interface TenantResult {
  id: string
  name: string
  slug: string
  logo?: string
  tagline?: string
}

// API Response types
interface FindDomainSuccessResponse {
  found: true
  tenant: {
    name: string
    logo: string | null
    slug: string
  }
}

interface FindDomainErrorResponse {
  found: false
  error: string
}

type FindDomainResponse = FindDomainSuccessResponse | FindDomainErrorResponse
```

## File Structure

```
src/app/(marketing)/find-domain/
├── page.tsx                    # Main page component
├── page.module.sass            # Page styles
├── hooks/
│   └── useFindDomain.ts        # State management hook
└── components/
    ├── index.ts                # Barrel export
    ├── TenantPreview.tsx       # Tenant info display
    └── TenantPreview.module.sass
```

## Related Features

- [Register](/docs/features/register.md) - For users without an existing company
- [Sign In](/docs/features/sign-in.md) - Destination after finding domain
