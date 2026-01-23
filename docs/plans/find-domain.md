# Find-Domain Feature Implementation Plan

## Overview
Build a find-domain page that allows users to enter their company slug/domain name and routes them to their tenant's sign-in page.

---

## Files to Create

### 1. API Endpoint
**`src/app/api/find-domain/route.ts`**
- GET endpoint that looks up tenant by slug
- Returns: `{ found: true, tenant: { name, logo, slug } }` or `{ found: false, error: string }`
- Uses `createMainPrismaClient()` from `@/lib/tenant-db`
- Validates slug format with regex: `/^[a-z0-9-]+$/`

### 2. Page Structure (Marketing Route Group)
```
src/app/(marketing)/find-domain/
├── page.tsx              # Main page component
├── page.module.sass      # Styles
├── hooks/
│   └── useFindDomain.ts  # State management & API logic
└── components/
    ├── index.ts          # Barrel export
    └── TenantPreview.tsx # Shows tenant info before redirect
```

---

## User Flow

1. User visits `/find-domain`
2. Enters company slug (e.g., "acme-corp") - auto-normalized to lowercase
3. Clicks "Find Company" → API lookup
4. **If found**: Shows TenantPreview with logo/name, button changes to "Continue to [Company]"
5. **If not found**: Shows error message, user can retry
6. Click continue → Redirects to `/{slug}/sign-in`

---

## Component Design

**Page Layout:**
- Centered FormCard (max-width: 480px)
- Title: "Find Your Company"
- Input for domain slug
- Link to `/register` for new users
- ThemeSwitcher in fixed position

**TenantPreview:**
- Company logo (Avatar component)
- Company name and slug
- Success checkmark indicator

---

## API Contract

```yaml
GET /api/find-domain?slug={slug}

Success (200):
  { found: true, tenant: { name: string, logo: string|null, slug: string } }

Not Found (200):
  { found: false, error: "Company not found" }

Invalid Format (200):
  { found: false, error: "Invalid domain format..." }

Server Error (500):
  { found: false, error: "Unable to verify domain" }
```

---

## Critical Reference Files

| Pattern | Reference File |
|---------|---------------|
| API structure | `src/app/api/check-slug/route.ts` |
| Hook pattern | `src/app/(marketing)/register/hooks/useRegistration.ts` |
| Page layout | `src/app/(marketing)/register/page.tsx` |
| SASS styling | `src/app/(marketing)/register/page.module.sass` |

---

## Redirect Destination

**Confirmed**: `/{slug}/sign-in` (path-based routing)
- Note: This route does not exist yet - will be created in a future task
- The find-domain feature will redirect there once implemented

---

## Verification Steps

1. **API Test**: `curl "http://localhost:3000/api/find-domain?slug=test-company"`
2. **UI Test**: Navigate to `/find-domain`, enter a known tenant slug
3. **Error Test**: Enter invalid/nonexistent slugs to verify error handling
4. **Redirect Test**: Verify redirect navigates to `/{slug}/sign-in` URL
