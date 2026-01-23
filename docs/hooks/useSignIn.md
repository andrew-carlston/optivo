# useSignIn Hook

Manages state and API interactions for the tenant sign-in feature, including two-step authentication flow.

## Import

```typescript
import { useSignIn } from '@/app/[tenant]/sign-in/hooks/useSignIn'
```

## Return Value

```typescript
interface UseSignInReturn {
  // Tenant info
  tenant: TenantInfo | null

  // Step navigation
  step: SignInStep
  handleBack: () => void
  handleBackToFindDomain: () => void

  // Form state
  email: string
  password: string
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void

  // Password visibility
  showPassword: boolean
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>

  // Submission state
  isCheckingEmail: boolean
  isSigningIn: boolean
  error: string | null

  // Form handlers
  handleEmailSubmit: (e?: React.FormEvent | React.MouseEvent) => Promise<void>
  handlePasswordSubmit: (e?: React.FormEvent | React.MouseEvent) => Promise<void>

  // User info (from email check)
  userInfo: UserInfo | null

  // UI helpers
  canSubmitEmail: boolean
  canSubmitPassword: boolean
  emailButtonText: string
  passwordButtonText: string
  userDisplayName: string
}
```

## Types

```typescript
// Step in the sign-in flow
export type SignInStep = 'email' | 'password'

// User info returned from email verification
export interface UserInfo {
  firstName: string
  lastName: string
  title: string | null
  avatar: string | null
}

// Tenant branding info from layout
export interface TenantInfo {
  name: string
  logo: string | null
  subtext: string | null
}
```

## Usage

### Basic Usage

```tsx
'use client'

import { useSignIn } from './hooks/useSignIn'

export default function SignInPage() {
  const {
    step,
    email,
    password,
    handleEmailChange,
    handlePasswordChange,
    handleEmailSubmit,
    handlePasswordSubmit,
    canSubmitEmail,
    canSubmitPassword,
    emailButtonText,
    passwordButtonText,
  } = useSignIn()

  const handleSubmit = step === 'email' ? handleEmailSubmit : handlePasswordSubmit
  const canSubmit = step === 'email' ? canSubmitEmail : canSubmitPassword
  const buttonText = step === 'email' ? emailButtonText : passwordButtonText

  return (
    <form onSubmit={handleSubmit}>
      {step === 'email' && (
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="you@example.com"
        />
      )}

      {step === 'password' && (
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
        />
      )}

      <button type="submit" disabled={!canSubmit}>
        {buttonText}
      </button>
    </form>
  )
}
```

### With Error Handling and User Info Display

```tsx
'use client'

import { useSignIn } from './hooks/useSignIn'
import { Avatar, Input, Button } from '@/components'

export default function SignInPage() {
  const {
    tenant,
    step,
    handleBack,
    handleBackToFindDomain,
    email,
    password,
    handleEmailChange,
    handlePasswordChange,
    showPassword,
    setShowPassword,
    handleEmailSubmit,
    handlePasswordSubmit,
    canSubmitEmail,
    canSubmitPassword,
    emailButtonText,
    passwordButtonText,
    userInfo,
    userDisplayName,
    error,
    isCheckingEmail,
    isSigningIn,
  } = useSignIn()

  return (
    <form onSubmit={step === 'email' ? handleEmailSubmit : handlePasswordSubmit}>
      {/* Tenant Header */}
      <header>
        <Avatar src={tenant?.logo || undefined} size="xl" />
        <h1>{tenant?.name || 'Loading...'}</h1>
      </header>

      {/* Email Step */}
      {step === 'email' && (
        <Input
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="you@example.com"
          disabled={isCheckingEmail}
          aria-describedby={error ? 'error-message' : undefined}
          aria-invalid={!!error}
          autoFocus
        />
      )}

      {/* Password Step */}
      {step === 'password' && (
        <>
          {/* User info display */}
          <div className="user-info">
            <Avatar src={userInfo?.avatar || undefined} size="lg" />
            <div>
              <span className="name">{userDisplayName}</span>
              {userInfo?.title && <span className="title">{userInfo.title}</span>}
            </div>
            <button type="button" onClick={handleBack}>
              Change
            </button>
          </div>

          {/* Password input with visibility toggle */}
          <div className="password-field">
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              disabled={isSigningIn}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </>
      )}

      {/* Error display */}
      {error && (
        <p id="error-message" role="alert" className="error">
          {error}
        </p>
      )}

      {/* Actions */}
      <footer>
        <Button
          type="button"
          variant="ghost"
          onClick={step === 'email' ? handleBackToFindDomain : handleBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={step === 'email' ? !canSubmitEmail : !canSubmitPassword}
        >
          {step === 'email' ? emailButtonText : passwordButtonText}
        </Button>
      </footer>
    </form>
  )
}
```

## State Details

### Tenant Info

| Property | Type | Description |
|----------|------|-------------|
| `tenant` | `TenantInfo \| null` | Tenant branding data loaded from layout's injected JSON |

The tenant info is loaded from a `<script id="tenant-data">` tag injected by the tenant layout.

### Step Navigation

| Property | Type | Description |
|----------|------|-------------|
| `step` | `'email' \| 'password'` | Current step in the sign-in flow |
| `handleBack` | `function` | Returns to email step, clears password and user info |
| `handleBackToFindDomain` | `function` | Navigates to `/find-domain` |

**handleBack Behavior**:
1. Sets step to `'email'`
2. Clears password
3. Resets showPassword to false
4. Clears any error
5. Clears userInfo

### Form State

| Property | Type | Description |
|----------|------|-------------|
| `email` | `string` | Current email input value |
| `password` | `string` | Current password input value |
| `handleEmailChange` | `function` | Email input change handler (clears error) |
| `handlePasswordChange` | `function` | Password input change handler (clears error) |

### Password Visibility

| Property | Type | Description |
|----------|------|-------------|
| `showPassword` | `boolean` | Whether password is visible |
| `setShowPassword` | `function` | State setter for password visibility |

### Submission State

| Property | Type | Description |
|----------|------|-------------|
| `isCheckingEmail` | `boolean` | True while `user-exists` API request is in flight |
| `isSigningIn` | `boolean` | True while `sign-in` API request is in flight |
| `error` | `string \| null` | Error message from failed requests |

### Form Handlers

| Property | Type | Description |
|----------|------|-------------|
| `handleEmailSubmit` | `async function` | Submits email to `user-exists` API |
| `handlePasswordSubmit` | `async function` | Submits credentials to `sign-in` API |

**handleEmailSubmit Behavior**:
1. Prevents default form submission
2. Validates `canSubmitEmail`
3. Sets `isCheckingEmail` to true
4. Calls `POST /api/{tenant}/user-exists`
5. On success with `exists: true`: stores `userInfo`, advances to password step
6. On success with `exists: false`: shows "No account found" error
7. On error: displays error message
8. Finally: sets `isCheckingEmail` to false

**handlePasswordSubmit Behavior**:
1. Prevents default form submission
2. Validates `canSubmitPassword`
3. Sets `isSigningIn` to true
4. Calls `POST /api/{tenant}/sign-in`
5. On success:
   - Stores `userId` and `userEmail` in localStorage
   - Redirects to `/[tenant]/onboarding` if `isNew: true`
   - Redirects to `/[tenant]/dashboard` if `isNew: false`
6. On error: displays error message
7. Finally: sets `isSigningIn` to false

### User Info

| Property | Type | Description |
|----------|------|-------------|
| `userInfo` | `UserInfo \| null` | User profile data returned from email check |

```typescript
interface UserInfo {
  firstName: string
  lastName: string
  title: string | null
  avatar: string | null
}
```

### UI Helpers

| Property | Type | Description |
|----------|------|-------------|
| `canSubmitEmail` | `boolean` | `true` when email is valid and not checking |
| `canSubmitPassword` | `boolean` | `true` when password has content and not signing in |
| `emailButtonText` | `string` | `"Checking..."` or `"Continue"` |
| `passwordButtonText` | `string` | `"Signing in..."` or `"Sign In"` |
| `userDisplayName` | `string` | Full name (firstName + lastName) or email fallback |

**canSubmitEmail Computation**:
```typescript
const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const canSubmitEmail = isValidEmail && !isCheckingEmail
```

**canSubmitPassword Computation**:
```typescript
const canSubmitPassword = password.length >= 1 && !isSigningIn
```

**userDisplayName Computation**:
```typescript
const userDisplayName = (() => {
  if (!userInfo) return email
  const fullName = [userInfo.firstName, userInfo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return fullName || email
})()
```

## State Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INITIAL STATE                               │
│  step: 'email', email: '', password: '', userInfo: null             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   User types email      │
                    │   handleEmailChange     │
                    │   - Updates email       │
                    │   - Clears error        │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   User submits email    │
                    │   handleEmailSubmit     │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   API: user-exists      │
                    │   isCheckingEmail: true │
                    └─────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
        [exists: true]     [exists: false]      [API error]
              │                   │                   │
              ▼                   ▼                   ▼
   ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐
   │ userInfo = data  │  │ error =        │  │ error =        │
   │ step = 'password'│  │ "No account    │  │ "Network       │
   └──────────────────┘  │  found"        │  │  error..."     │
              │          └────────────────┘  └────────────────┘
              ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    PASSWORD STEP                         │
   │   Displays: userInfo (name, avatar, title)               │
   │   Actions: handleBack (→ email), handlePasswordChange    │
   └──────────────────────────────────────────────────────────┘
              │
              ▼
   ┌──────────────────┐
   │ User submits     │
   │ password         │
   │ handlePasswordSubmit │
   └──────────────────┘
              │
              ▼
   ┌──────────────────┐
   │ API: sign-in     │
   │ isSigningIn: true│
   └──────────────────┘
              │
       ┌──────┴──────┐
       │             │
   [success]     [error]
       │             │
       │             ▼
       │    ┌────────────────┐
       │    │ error =        │
       │    │ "Invalid       │
       │    │  password"     │
       │    └────────────────┘
       │
       ├── localStorage.setItem('userId', ...)
       ├── localStorage.setItem('userEmail', ...)
       │
       ├── isNew: true ─────► window.location.href = '/[tenant]/onboarding'
       │
       └── isNew: false ────► window.location.href = '/[tenant]/dashboard'
```

## Dependencies

- `useState` - React state management
- `useCallback` - Memoized handlers
- `useEffect` - Load tenant data on mount
- `useParams` - Next.js route params (tenant slug)
- `useRouter` - Next.js navigation (for handleBackToFindDomain)

## localStorage Usage

On successful sign-in, the hook stores user data in localStorage:

```typescript
localStorage.setItem('userId', data.user.id)
localStorage.setItem('userEmail', data.user.email || email)
```

This data is used by the onboarding flow to identify the current user.

## Error States

| Error Message | Trigger |
|---------------|---------|
| `"No account found with this email address."` | `user-exists` returns `exists: false` |
| `"Unable to verify email. Please try again."` | `user-exists` returns error response |
| `"Network error. Please check your connection and try again."` | Fetch fails for either API |
| `"Invalid password. Please try again."` | `sign-in` returns error response |

## Source File

`src/app/[tenant]/sign-in/hooks/useSignIn.ts`

## Related

- [Tenant Sign-In Feature](/docs/features/tenant-sign-in.md)
- [Sign-In API](/docs/api/sign-in.md)
- [useFindDomain Hook](/docs/hooks/useFindDomain.md) - Similar pattern for find-domain feature
