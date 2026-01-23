# Tenant Sign-In API

Authentication endpoints for tenant user sign-in flow.

---

## POST `/api/[tenant]/user-exists`

Checks if a user exists in the tenant's directory and returns their profile information for display during sign-in.

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant` | `string` | Yes | The tenant slug (e.g., `acme-corp`) |

### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address |

### Validation

**Tenant slug format**:
- Lowercase letters (`a-z`)
- Numbers (`0-9`)
- Hyphens (`-`)
- **Regex**: `/^[a-z0-9-]+$/`

**Email format**:
- Standard email format
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Response

#### User Exists (200 OK)

When the email is found in the tenant's `core_directory`:

```json
{
  "exists": true,
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": "Johnny",
    "avatar": "https://example.com/avatars/john.jpg",
    "title": "Software Engineer"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `exists` | `boolean` | Always `true` when user is found |
| `user.firstName` | `string \| null` | User's first name from `core_directory_personal` |
| `user.lastName` | `string \| null` | User's last name from `core_directory_personal` |
| `user.preferredName` | `string \| null` | User's preferred name |
| `user.avatar` | `string \| null` | URL to user's avatar image |
| `user.title` | `string \| null` | User's job title |

#### User Does Not Exist (200 OK)

When no user is found with the given email:

```json
{
  "exists": false,
  "user": null
}
```

#### Missing Email (400 Bad Request)

```json
{
  "error": "Email is required"
}
```

#### Invalid Email Format (400 Bad Request)

```json
{
  "error": "Invalid email format"
}
```

#### Invalid Tenant Slug (400 Bad Request)

```json
{
  "error": "Invalid tenant identifier"
}
```

#### Tenant Not Found (404 Not Found)

```json
{
  "error": "Tenant not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to check user existence"
}
```

### Examples

#### cURL

```bash
# Check if user exists
curl -X POST "http://localhost:3000/api/acme-corp/user-exists" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@acme.com"}'

# Response (user exists)
{
  "exists": true,
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": null,
    "avatar": "https://example.com/avatars/john.jpg",
    "title": "Software Engineer"
  }
}

# Response (user does not exist)
{
  "exists": false,
  "user": null
}
```

#### TypeScript

```typescript
interface UserExistsResponse {
  exists: boolean
  user?: {
    firstName: string | null
    lastName: string | null
    preferredName: string | null
    avatar: string | null
    title: string | null
  }
  error?: string
}

async function checkUserExists(tenant: string, email: string): Promise<UserExistsResponse> {
  const response = await fetch(`/api/${tenant}/user-exists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  return response.json()
}

// Usage
const result = await checkUserExists('acme-corp', 'john@acme.com')
if (result.exists) {
  console.log('User found:', result.user?.firstName, result.user?.lastName)
} else {
  console.log('No account found')
}
```

### Security Notes

- **Timing attack mitigation**: A minimum 100ms delay is added to all responses to prevent timing-based user enumeration
- **SQL injection prevention**: Email input is escaped before use in raw SQL queries
- Returns user profile information to improve UX (showing name/avatar during sign-in)

---

## POST `/api/[tenant]/sign-in`

Authenticates a user with email and password and returns a redirect destination.

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant` | `string` | Yes | The tenant slug (e.g., `acme-corp`) |

### Request Body

```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address |
| `password` | `string` | Yes | User's password |

### Validation

**Tenant slug format**:
- Lowercase letters (`a-z`)
- Numbers (`0-9`)
- Hyphens (`-`)
- **Regex**: `/^[a-z0-9-]+$/`

**Email format**:
- Standard email format
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Password**:
- Required (any length)

### Response

#### Authentication Success (200 OK)

When credentials are valid:

```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@acme.com"
  },
  "isNew": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `true` for successful authentication |
| `user.id` | `string` | User's UUID from `core_directory` |
| `user.email` | `string` | User's email address |
| `isNew` | `boolean` | `true` if user has never completed onboarding |

**isNew Flag Behavior**:
- `isNew: true` - User should be redirected to `/[tenant]/onboarding`
- `isNew: false` - User should be redirected to `/[tenant]/dashboard`

#### Missing Credentials (400 Bad Request)

```json
{
  "error": "Email and password are required"
}
```

#### Invalid Email Format (400 Bad Request)

```json
{
  "error": "Invalid email format"
}
```

#### Invalid Tenant Slug (400 Bad Request)

```json
{
  "error": "Invalid tenant identifier"
}
```

#### Tenant Not Found (404 Not Found)

```json
{
  "error": "Tenant not found"
}
```

#### Invalid Credentials (401 Unauthorized)

When email is not found or password is incorrect:

```json
{
  "error": "Invalid email or password"
}
```

**Note**: The same error message is returned for both invalid email and invalid password to prevent user enumeration.

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Authentication failed"
}
```

### Examples

#### cURL

```bash
# Sign in
curl -X POST "http://localhost:3000/api/acme-corp/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@acme.com", "password": "secret123"}'

# Response (success - returning user)
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@acme.com"
  },
  "isNew": false
}

# Response (success - new user)
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@acme.com"
  },
  "isNew": true
}

# Response (invalid credentials)
{
  "error": "Invalid email or password"
}
```

#### TypeScript

```typescript
interface SignInSuccessResponse {
  success: true
  user: {
    id: string
    email: string
  }
  isNew: boolean
}

interface SignInErrorResponse {
  success?: false
  error: string
}

type SignInResponse = SignInSuccessResponse | SignInErrorResponse

async function signIn(tenant: string, email: string, password: string): Promise<SignInResponse> {
  const response = await fetch(`/api/${tenant}/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return response.json()
}

// Usage
const result = await signIn('acme-corp', 'john@acme.com', 'secret123')

if ('success' in result && result.success) {
  // Store user info
  localStorage.setItem('userId', result.user.id)
  localStorage.setItem('userEmail', result.user.email)

  // Redirect based on isNew flag
  if (result.isNew) {
    window.location.href = `/${tenant}/onboarding`
  } else {
    window.location.href = `/${tenant}/dashboard`
  }
} else {
  console.error('Sign-in failed:', result.error)
}
```

### Authentication

Both endpoints do not require prior authentication. They are the entry point for user authentication.

### Rate Limiting

No rate limiting is currently implemented. Consider adding rate limiting in production to prevent brute-force attacks.

### Security Considerations

1. **Generic error messages**: Invalid credentials return "Invalid email or password" regardless of whether the email exists or the password is wrong
2. **Password hashing**: Passwords are verified using bcrypt comparison against stored hashes
3. **SQL injection prevention**: Email inputs are escaped before use in raw SQL queries
4. **No session tokens**: This API does not set cookies or return tokens; the frontend handles redirect and localStorage storage

---

## Error Codes Summary

| HTTP Status | Error Message | Endpoint | Description |
|-------------|---------------|----------|-------------|
| 400 | `Email is required` | user-exists | Missing email in request body |
| 400 | `Email and password are required` | sign-in | Missing email or password |
| 400 | `Invalid email format` | Both | Email fails regex validation |
| 400 | `Invalid tenant identifier` | Both | Tenant slug fails regex validation |
| 404 | `Tenant not found` | Both | No tenant exists with given slug |
| 401 | `Invalid email or password` | sign-in | User not found or password mismatch |
| 500 | `Failed to check user existence` | user-exists | Database or server error |
| 500 | `Authentication failed` | sign-in | Database or server error |

---

## Database Schema Reference

### Tables Used

**Main Database**:
- `tenant` - Verifies tenant exists by slug

**Tenant Schema** (`"{tenant}".`):
- `core_directory` - User authentication data (id, email, password, is_new)
- `core_directory_personal` - User profile data (first_name, last_name, preferred_name, avatar, title)

### Queries

**user-exists endpoint**:
```sql
SELECT
  d.id, d.email, d.worker_type, d.status, d.role,
  p.first_name, p.last_name, p.preferred_name, p.avatar, p.title
FROM "{tenant}".core_directory d
LEFT JOIN "{tenant}".core_directory_personal p ON p.directory_id = d.id
WHERE d.email = '{email}'
```

**sign-in endpoint**:
```sql
SELECT id, email, password, is_new
FROM "{tenant}".core_directory
WHERE email = '{email}'
LIMIT 1
```

---

## Source Files

- `src/app/api/[tenant]/user-exists/route.ts`
- `src/app/api/[tenant]/sign-in/route.ts`
