# Tenant Sign-In Feature

Enables users to authenticate into their organization's tenant workspace using a two-step sign-in flow.

## Overview

| Attribute | Details |
|-----------|---------|
| **Purpose** | Authenticate users into their tenant workspace with secure two-step verification |
| **Target Users** | Existing users with accounts in their organization's tenant |
| **Route** | `/[tenant]/sign-in` |
| **Dependencies** | Prisma (tenant database), bcrypt, Avatar component, FormCard component |

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TENANT SIGN-IN FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ /find-domain │
     └──────┬───────┘
            │
            ▼
┌───────────────────────┐
│   Email Step (1/2)    │
│  ─────────────────    │
│  • Tenant branding    │
│  • Email input        │
│  • Back → /find-domain│
└───────────┬───────────┘
            │
            │ [Continue]
            ▼
    ┌───────────────┐
    │ POST          │
    │ /api/[tenant] │──────┐
    │ /user-exists  │      │
    └───────┬───────┘      │
            │              │
      ┌─────┴─────┐        │
      │           │        │
   [exists]   [!exists]    │
      │           │        │
      │           ▼        │
      │    ┌───────────┐   │
      │    │ Error:    │   │
      │    │ "No       │   │
      │    │ account"  │   │
      │    └───────────┘   │
      │                    │
      ▼                    │
┌───────────────────────┐  │
│  Password Step (2/2)  │  │
│  ──────────────────   │  │
│  • User avatar/name   │  │
│  • Password input     │  │
│  • Visibility toggle  │  │
│  • Back → Email step  │  │
└───────────┬───────────┘  │
            │              │
            │ [Sign In]    │
            ▼              │
    ┌───────────────┐      │
    │ POST          │      │
    │ /api/[tenant] │──────┘
    │ /sign-in      │
    └───────┬───────┘
            │
      ┌─────┴─────┐
      │           │
   [success]   [error]
      │           │
      │           ▼
      │    ┌───────────┐
      │    │ Error:    │
      │    │ "Invalid  │
      │    │ password" │
      │    └───────────┘
      │
      ├── isNew: true ──────► /[tenant]/onboarding
      │                       + localStorage: userId, userEmail
      │
      └── isNew: false ─────► /[tenant]/dashboard
                              + localStorage: userId, userEmail
```

## Pages

| Page | Path | Description |
|------|------|-------------|
| Sign In | `/[tenant]/sign-in` | Two-step authentication form with tenant branding |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/[tenant]/user-exists` | Checks if email exists and returns user info |
| POST | `/api/[tenant]/sign-in` | Authenticates user with email and password |

See [API Documentation](/docs/api/sign-in.md) for full details.

## Components

| Component | Description |
|-----------|-------------|
| `FormCard` | Card container with header/footer slots for form layout |
| `Avatar` | Displays tenant logo and user avatar |
| `Input` | Form input with label and accessibility support |
| `Button` | Action buttons for navigation and submission |
| `ThemeSwitcher` | Light/dark mode toggle |

## State Management

The feature uses the `useSignIn` hook for all state management and API interactions.

### Hook: `useSignIn`

**Location**: `src/app/[tenant]/sign-in/hooks/useSignIn.ts`

**Import**:
```typescript
import { useSignIn } from './hooks/useSignIn'
```

**Return Value Interface**:
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

See [Hook Documentation](/docs/hooks/useSignIn.md) for full details.

### State Details

| State | Type | Description |
|-------|------|-------------|
| `step` | `'email' \| 'password'` | Current step in the sign-in flow |
| `email` | `string` | User's email address input |
| `password` | `string` | User's password input |
| `showPassword` | `boolean` | Password visibility toggle state |
| `isCheckingEmail` | `boolean` | True while checking email existence |
| `isSigningIn` | `boolean` | True while authenticating |
| `error` | `string \| null` | Error message from failed requests |
| `userInfo` | `UserInfo \| null` | User profile data returned from email check |
| `tenant` | `TenantInfo \| null` | Tenant branding data from layout |

### Computed Values

| Value | Type | Description |
|-------|------|-------------|
| `canSubmitEmail` | `boolean` | True when email is valid and not checking |
| `canSubmitPassword` | `boolean` | True when password is entered and not signing in |
| `emailButtonText` | `string` | "Checking..." or "Continue" |
| `passwordButtonText` | `string` | "Signing in..." or "Sign In" |
| `userDisplayName` | `string` | Full name (firstName + lastName) or email |

## Key Features

### 1. Two-Step Authentication

The sign-in process is split into two steps for security and UX:

1. **Email Step**: User enters email, system verifies account exists
2. **Password Step**: User enters password after email verification

This prevents password attempts against non-existent accounts.

### 2. User Info Display

After email verification, the password step displays:
- User's avatar (from `core_directory_personal`)
- Full name (firstName + lastName)
- Job title (if available)
- "Change" button to go back to email step

### 3. New User Detection

The sign-in API returns an `isNew` flag from the `core_directory.is_new` column:
- **New users** (`isNew: true`): Redirected to `/[tenant]/onboarding`
- **Returning users** (`isNew: false`): Redirected to `/[tenant]/dashboard`

### 4. localStorage User Storage

On successful sign-in, user data is stored in localStorage:
```typescript
localStorage.setItem('userId', data.user.id)
localStorage.setItem('userEmail', data.user.email || email)
```

This enables the onboarding flow to access user context.

### 5. Password Visibility Toggle

Password field includes a visibility toggle button:
- Eye icon to show password
- Eye-off icon to hide password
- Proper ARIA labels for accessibility

### 6. Tenant Branding

The sign-in page displays tenant information:
- Tenant logo (via Avatar component)
- Tenant name
- Tenant subtext/tagline (if configured)

## Usage Example

```tsx
'use client'

import { Avatar, Button, FormCard, Input, ThemeSwitcher } from '@/components'
import { useSignIn } from './hooks/useSignIn'
import styles from './page.module.sass'

export default function SignInPage() {
  const signIn = useSignIn()
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
    isCheckingEmail,
    isSigningIn,
    error,
    handleEmailSubmit,
    handlePasswordSubmit,
    userInfo,
    canSubmitEmail,
    canSubmitPassword,
    emailButtonText,
    passwordButtonText,
    userDisplayName,
  } = signIn

  const handleFormSubmit = step === 'email' ? handleEmailSubmit : handlePasswordSubmit

  return (
    <div className={styles.page}>
      <ThemeSwitcher />

      <FormCard
        onSubmit={handleFormSubmit}
        header={
          <div className={styles.header}>
            <Avatar
              src={tenant?.logo || undefined}
              size="xl"
              placeholder={tenant?.name?.charAt(0) || 'C'}
            />
            <h1>{tenant?.name || 'Loading...'}</h1>
            {tenant?.subtext && <p>{tenant.subtext}</p>}
          </div>
        }
        footer={
          <>
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
          </>
        }
      >
        {/* Email Step */}
        {step === 'email' && (
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isCheckingEmail}
            autoFocus
          />
        )}

        {/* Password Step */}
        {step === 'password' && (
          <>
            <div className={styles.userInfoDisplay}>
              <Avatar
                src={userInfo?.avatar || undefined}
                size="lg"
                placeholder={userDisplayName.charAt(0).toUpperCase()}
              />
              <div>
                <span>{userDisplayName}</span>
                {userInfo?.title && <span>{userInfo.title}</span>}
              </div>
              <button type="button" onClick={handleBack}>
                Change
              </button>
            </div>

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              autoComplete="current-password"
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
          </>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" className={styles.errorMessage}>
            {error}
          </div>
        )}
      </FormCard>
    </div>
  )
}
```

## Types

```typescript
// Sign-in step type
export type SignInStep = 'email' | 'password'

// User info returned from email check
export interface UserInfo {
  firstName: string
  lastName: string
  title: string | null
  avatar: string | null
}

// Tenant info from layout
export interface TenantInfo {
  name: string
  logo: string | null
  subtext: string | null
}

// API Response: user-exists
interface UserExistsResponse {
  exists: boolean
  user?: {
    firstName: string | null
    lastName: string | null
    preferredName: string | null
    avatar: string | null
    title: string | null
  }
}

// API Response: sign-in success
interface SignInSuccessResponse {
  success: true
  user: {
    id: string
    email: string
  }
  isNew: boolean
}

// API Response: sign-in error
interface SignInErrorResponse {
  success?: false
  error: string
}
```

## File Structure

```
src/app/[tenant]/sign-in/
├── page.tsx                    # Main sign-in page component
├── page.module.sass            # Page styles
└── hooks/
    └── useSignIn.ts            # State management hook

src/app/api/[tenant]/
├── sign-in/
│   └── route.ts                # Sign-in authentication endpoint
└── user-exists/
    └── route.ts                # Email verification endpoint
```

## Security Considerations

1. **Generic error messages**: Invalid credentials return "Invalid email or password" to prevent user enumeration
2. **Timing attack mitigation**: `user-exists` endpoint adds 100ms delay to normalize response times
3. **Password hashing**: Passwords are hashed with bcrypt before storage and comparison
4. **SQL injection prevention**: Email inputs are escaped before use in queries
5. **Input validation**: Email format and tenant slug are validated before database queries

## Related Features

- [Find Domain](/docs/features/find-domain.md) - Entry point before sign-in
- [Onboarding](/docs/features/onboarding.md) - Destination for new users (isNew: true)
- [Dashboard](/docs/features/dashboard.md) - Destination for returning users (isNew: false)
