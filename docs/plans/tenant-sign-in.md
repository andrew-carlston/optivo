# Tenant Sign-In Feature Plan

## Summary
Create `[tenant]` dynamic routes with an animated two-step sign-in page that shows company branding (logo + tagline) and finds the user before showing the password field.

---

## Files to Create

### 1. Tenant Route Structure
```
src/app/[tenant]/
├── layout.tsx                 # Fetches tenant info, validates slug exists
└── sign-in/
    ├── page.tsx               # Sign-in UI with animations
    ├── page.module.sass       # Styles + keyframe animations
    └── hooks/
        └── useSignIn.ts       # State management for two-step flow
```

### 2. API Endpoints
```
src/app/api/[tenant]/
├── user-exists/
│   └── route.ts               # POST - Check if email exists in tenant
└── sign-in/
    └── route.ts               # POST - Authenticate with email/password
```

---

## Implementation Details

### Sign-In Flow Animation
1. **Step 1 (Email)**: User enters email → "Continue" button
2. **API Check**: POST `/api/[tenant]/user-exists` → returns `{ exists: true/false }`
3. **Step 2 (Password)**: If user found, fade out email step, fade in:
   - User email display with back option
   - Password input field
   - "Sign In" button

### Tenant Layout (`[tenant]/layout.tsx`)
- Server component fetches tenant from DB by slug
- If tenant not found → `notFound()` (404 page)
- Passes tenant info (name, logo, subtext) to children

### Sign-In Page (`[tenant]/sign-in/page.tsx`)
- Company Avatar (large, centered) using `<Avatar>` component
- Company name as heading
- Tagline/subtext below
- FormCard containing the animated form steps

### useSignIn Hook
```typescript
interface UseSignInReturn {
  step: 'email' | 'password'
  email: string
  password: string
  isCheckingEmail: boolean
  isSigningIn: boolean
  error: string | null
  handleEmailChange, handlePasswordChange
  handleEmailSubmit, handlePasswordSubmit
  handleBack  // Return to email step
}
```

### API: user-exists (`/api/[tenant]/user-exists`)
- Query: `SELECT 1 FROM "{tenant}".core_directory WHERE email = $1`
- Returns: `{ exists: boolean }`
- Add minimum 100ms delay to prevent timing attacks

### API: sign-in (`/api/[tenant]/sign-in`)
- Query user by email from tenant's `core_directory`
- Use `bcrypt.compare()` for password verification
- Returns: `{ success: true, user: { id, email, isNew } }` or error

---

## Animation CSS (page.module.sass)
```sass
@keyframes fadeIn
  from
    opacity: 0
    transform: translateY(-8px)
  to
    opacity: 1
    transform: translateY(0)

@keyframes slideOut
  from
    opacity: 1
    transform: translateX(0)
  to
    opacity: 0
    transform: translateX(-20px)
```

---

## Find-Domain Update
The redirect already exists in `useFindDomain.ts:79`:
```typescript
router.push(`/${tenant.slug}/sign-in`)
```
No changes needed - just need the route to exist.

---

## Critical Reference Files
- `src/app/(marketing)/find-domain/hooks/useFindDomain.ts` - Hook pattern
- `src/app/(marketing)/find-domain/page.tsx` - Page layout pattern
- `src/lib/tenant-db.ts` - Database access patterns
- `src/app/api/register/route.ts` - bcrypt and raw SQL patterns

---

## Verification
1. Start dev server: `pnpm dev`
2. Go to `/find-domain` and search for "lawnstater"
3. Click "Continue to Lawnstater" → should redirect to `/lawnstater/sign-in`
4. Verify company logo and tagline display
5. Enter email → click Continue → verify animation
6. Enter password → sign in → verify authentication works
