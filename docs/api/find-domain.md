# Find Domain API

Looks up a tenant by slug and returns basic tenant information.

## GET `/api/find-domain`

Searches for a tenant in the main database by their unique slug identifier.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` | Yes | The tenant slug to search for (e.g., `acme-corp`) |

### Slug Validation

The slug must match the following format:
- Lowercase letters (`a-z`)
- Numbers (`0-9`)
- Hyphens (`-`)

**Regex pattern**: `/^[a-z0-9-]+$/`

### Response

#### Success (200 OK)

When a tenant is found:

```json
{
  "found": true,
  "tenant": {
    "name": "Acme Corporation",
    "logo": "https://example.com/logos/acme.png",
    "slug": "acme-corp"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `found` | `boolean` | Always `true` for successful lookups |
| `tenant.name` | `string` | The tenant's display name |
| `tenant.logo` | `string \| null` | URL to the tenant's logo image |
| `tenant.slug` | `string` | The tenant's unique slug |

#### Not Found (200 OK)

When no tenant matches the slug:

```json
{
  "found": false,
  "error": "Company not found"
}
```

#### Invalid Format (200 OK)

When the slug contains invalid characters or is empty:

```json
{
  "found": false,
  "error": "Invalid domain format. Use only lowercase letters, numbers, and hyphens."
}
```

#### Server Error (500 Internal Server Error)

When a database or server error occurs:

```json
{
  "found": false,
  "error": "Unable to verify domain"
}
```

### Examples

#### cURL

```bash
# Search for a tenant
curl "http://localhost:3000/api/find-domain?slug=acme-corp"

# Response (found)
{"found":true,"tenant":{"name":"Acme Corporation","logo":null,"slug":"acme-corp"}}

# Response (not found)
{"found":false,"error":"Company not found"}
```

#### JavaScript/TypeScript

```typescript
async function findDomain(slug: string) {
  const response = await fetch(`/api/find-domain?slug=${encodeURIComponent(slug)}`)
  const data = await response.json()

  if (data.found) {
    console.log('Found tenant:', data.tenant.name)
    return data.tenant
  } else {
    console.error('Error:', data.error)
    return null
  }
}
```

### Authentication

This endpoint does not require authentication. It is publicly accessible to allow users to find their company before signing in.

### Rate Limiting

No rate limiting is currently implemented. Consider adding rate limiting in production to prevent abuse.

### Error Codes

| Code | Error Message | Description |
|------|---------------|-------------|
| - | `Invalid domain format...` | Slug is empty or contains invalid characters |
| - | `Company not found` | No tenant exists with the provided slug |
| 500 | `Unable to verify domain` | Database connection or query error |

### Implementation Notes

- Uses `createMainPrismaClient()` from `@/lib/tenant-db` to connect to the main database
- Database connection is properly disconnected after each request using `finally` block
- Only returns essential tenant fields (`name`, `logo`, `slug`) for security
- Slug validation happens before any database query to prevent unnecessary lookups

### Source File

`src/app/api/find-domain/route.ts`
