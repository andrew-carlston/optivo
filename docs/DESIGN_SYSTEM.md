# Optivo Design System

Quick reference for building UI in Optivo. All values pulled from source files — if something drifts, the code is authoritative.

## Rules

- **SCSS only** — no Tailwind, no CSS-in-JS, no inline styles for anything themeable
- **CSS variables** for colors/shadows (theme-aware), **SCSS tokens** for spacing/radius/type (static)
- **`cn()` utility** (`@/lib/cn`) for conditional classnames — `cn("card", active && "card--active")`
- **BEM naming** — `.component`, `.component--modifier`, `.component__element`
- **Themes applied via data attributes** — `data-theme="default|midnight|ember"`, `data-mode="light|dark"`
- **No hardcoded colors** — always use CSS variables so themes work

## SCSS Tokens

Import with `@use "../../../styles/tokens" as *;` (adjust path depth as needed).

Source: `src/styles/_tokens.scss`

### Spacing

| Token | Value |
|-------|-------|
| `$space-xs` | 0.25rem (4px) |
| `$space-sm` | 0.5rem (8px) |
| `$space-md` | 0.75rem (12px) |
| `$space-lg` | 1rem (16px) |
| `$space-xl` | 1.5rem (24px) |
| `$space-2xl` | 2rem (32px) |

### Typography

| Token | Value |
|-------|-------|
| `$text-xs` | 0.6875rem (11px) |
| `$text-sm` | 0.8125rem (13px) |
| `$text-base` | 0.9375rem (15px) |
| `$text-lg` | 1.125rem (18px) |
| `$text-xl` | 1.5rem (24px) |
| `$text-2xl` | 2rem (32px) |

### Border Radius

| Token | Value |
|-------|-------|
| `$radius-sm` | 6px |
| `$radius-md` | 10px |
| `$radius-lg` | 14px |
| `$radius-xl` | 20px |
| `$radius-full` | 9999px |

### Other

| Token | Value |
|-------|-------|
| `$touch-min` | 36px |
| `$z-dropdown` | 100 |
| `$z-modal` | 200 |
| `$z-toast` | 300 |
| `$z-tooltip` | 400 |

## CSS Variables (Theme-Aware)

Defined per theme per mode in `src/styles/themes/`. Use as `var(--name)`.

### Colors

| Variable | Purpose |
|----------|---------|
| `--bg` | Page background |
| `--fg` | Primary text color |
| `--surface` | Card/panel background |
| `--surface-2` | Secondary surface (inset cards, alt rows) |
| `--border` | Default border |
| `--border-strong` | Emphasized border |
| `--input-bg` | Input field background |
| `--accent` | Subtle accent background |
| `--muted` | Muted background |
| `--muted-fg` | Muted/secondary text |
| `--pop` | Accent/brand color (blue, purple, or orange per theme) |
| `--pop-fg` | Text on `--pop` background |
| `--pop-muted` | Light tint of accent |
| `--success` | Green |
| `--success-fg` | Text on success |
| `--success-muted` | Light green tint |
| `--warning` | Amber/yellow |
| `--warning-fg` | Text on warning |
| `--danger` | Red |
| `--danger-fg` | Text on danger |
| `--info` | Blue/sky |
| `--info-fg` | Text on info |
| `--ring` | Focus ring color |

### Shadows

| Variable | Purpose |
|----------|---------|
| `--shadow-xs` | Barely-there elevation |
| `--shadow-sm` | Subtle lift |
| `--shadow-md` | Standard card elevation (used by Card `raised`) |
| `--shadow-lg` | Prominent elevation (used by Card `raised` hover) |
| `--shadow-inset` | Inner shadow + inner ring (used by Card `inset`) |

Shadow behavior by mode:
- **Light modes** — theme-tinted shadows using the theme's `--fg` base color at low opacity
- **Dark modes** — black (`rgba(0,0,0,...)`) at higher opacity for visibility on dark surfaces

## Themes

Source: `src/styles/themes/`

| Theme | `data-theme` | Accent (`--pop`) | Character |
|-------|-------------|------------------|-----------|
| Default | `default` | `#2563EB` (blue) | Clean, professional |
| Midnight | `midnight` | `#7C3AED` (purple) | Refined, deep indigo |
| Ember | `ember` | `#EA580C` (orange) | Warm, amber tones |

Each theme defines light + dark mode. Applied via:
```html
<html data-theme="default" data-mode="light">
```

## Components

All components live in `src/components/ui/{name}/`. Each has a `.tsx` and `.scss` file.

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card/card";

<Card variant="flat">    // default — border, no shadow
<Card variant="raised">  // borderless, shadow-md, lifts to shadow-lg on hover
<Card variant="inset">   // surface-2 bg, inner shadow, recessed look

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    {/* optional actions slot */}
  </CardHeader>
  <CardContent>
    {/* body */}
  </CardContent>
</Card>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"flat" \| "raised" \| "inset"` | `"flat"` |

### Button

```tsx
import { Button } from "@/components/ui/button/button";

<Button variant="primary" size="lg" loading>Label</Button>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"default" \| "primary" \| "outline" \| "ghost" \| "danger" \| "link"` | `"default"` |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` |
| `loading` | `boolean` | — |

### Input

```tsx
import { Input } from "@/components/ui/input/input";

<Input placeholder="Search..." icon={<Search size={16} />} error loading />
```

| Prop | Type | Default |
|------|------|---------|
| `icon` | `ReactNode` | — |
| `error` | `boolean` | — |
| `loading` | `boolean` | — |

### Select

```tsx
import { Select, MultiSelect, type SelectOption } from "@/components/ui/select/select";

const options: SelectOption[] = [{ value: "a", label: "Option A" }];

<Select options={options} value={val} onChange={setVal} placeholder="Choose..." />
<MultiSelect options={options} selected={vals} onChange={setVals} searchable />
```

**Select props:** `options`, `value`, `onChange`, `placeholder`, `loading`, `disabled`

**MultiSelect props:** `options`, `selected`, `onChange`, `placeholder`, `searchable` (default true), `loading`, `disabled`

### Switch

```tsx
import { Switch } from "@/components/ui/switch/switch";

<Switch checked={val} onCheckedChange={setVal} disabled />
```

| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | — |
| `onCheckedChange` | `(checked: boolean) => void` | — |
| `disabled` | `boolean` | — |

### Badge

```tsx
import { Badge } from "@/components/ui/badge/badge";

<Badge variant="success">On Time</Badge>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"default" \| "success" \| "warning" \| "danger" \| "info" \| "outline"` | `"default"` |

### Skeleton

```tsx
import { Skeleton, SkeletonText, SkeletonButton, SkeletonAvatar, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton/skeleton";

<Skeleton width={120} height={20} radius="sm" />
<SkeletonText width="60%" />
<SkeletonButton width={80} />
<SkeletonAvatar size={40} />
<SkeletonCard />
<SkeletonTable rows={5} cols={4} />
```

Button and Input also support a `loading` prop that renders their skeleton automatically.

### AccessGate

```tsx
import { AccessGate, withAccess } from "@/components/ui/access-gate/access-gate";

<AccessGate access="attendance:edit" fallback={<p>No access</p>}>
  <Button>Adjust Points</Button>
</AccessGate>

// HOC version
const ProtectedButton = withAccess(Button, "attendance:edit");
```

| Prop | Type | Default |
|------|------|---------|
| `access` | `string` (`"resource:action"`) | required |
| `fallback` | `ReactNode` | `null` (hidden) |
| `loading` | `ReactNode` | `null` |

> Note: Currently allows everything — wired to real ReBAC hook when auth is built.

### AppShell

```tsx
import { AppShell } from "@/components/ui/app-shell/app-shell";

<AppShell header={<Header ... />} footer={<Footer />}>
  {children}
</AppShell>
```

Auto-hides header on scroll down, shows on scroll up. Peek button when hidden. Expand/collapse toggle persisted to localStorage.

### Header

```tsx
import { Header, NavItem } from "@/components/ui/header/header";

<Header
  logo={<>Optivo</>}
  nav={<NavItem href="/dashboard" active>Dashboard</NavItem>}
  actions={<Button size="sm">Settings</Button>}
/>
```

### Footer

```tsx
import { Footer } from "@/components/ui/footer/footer";

<Footer />
```

Renders brand name + copyright year. Sticky to bottom of AppShell.

### AuthCard

```tsx
import { AuthCard, AuthCardNotFound } from "@/components/ui/auth-card/auth-card";

<AuthCard
  companyName="LawnStarter"
  logoUrl={null}
  allowGoogle
  allowPassword
  allowSignup
  loading={false}
  error="Invalid credentials"
  onGoogleSSO={handleGoogleSSO}
  onEmailSignIn={handleEmailSignIn}
  onEmailSignUp={handleEmailSignUp}
  submitting={false}
  footer="Powered by Optivo"
/>

<AuthCardNotFound onGoHome={() => router.push("/")} />
```

| Prop | Type | Default |
|------|------|---------|
| `companyName` | `string` | required |
| `logoUrl` | `string \| null` | — |
| `subtitle` | `string` | `"Sign in to continue"` |
| `allowGoogle` | `boolean` | `true` |
| `allowPassword` | `boolean` | `true` |
| `allowSignup` | `boolean` | `true` |
| `loading` | `boolean` | `false` (renders skeleton) |
| `error` | `string` | — |
| `onGoogleSSO` | `() => void` | — |
| `onEmailSignIn` | `(email, password) => void` | — |
| `onEmailSignUp` | `(email, password, name) => void` | — |
| `submitting` | `boolean` | `false` |
| `footer` | `string` | `"Powered by Optivo"` |

### Avatar

```tsx
import { Avatar } from "@/components/ui/avatar/avatar";

<Avatar src="/photo.jpg" alt="Jane Doe" size="md" />
<Avatar alt="Jane Doe" size="sm" />          // initials fallback ("JD")
<Avatar src="/logo.png" alt="LawnStarter" size="lg" />
```

Displays an image with initials fallback when `src` is missing or fails to load. Initials are derived from the first letter of each word in `alt`.

| Prop | Type | Default |
|------|------|---------|
| `src` | `string \| null` | — |
| `alt` | `string` | required |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` |

Size mapping: `sm` = 28px, `md` = 34px, `lg` = 44px.

### ThemeSwitcher

```tsx
import { ThemeSwitcher } from "@/components/ui/theme-switcher/theme-switcher";

<ThemeSwitcher />
```

Radix DropdownMenu with two sections:
- **Mode slider**: Light / System / Dark (3-position toggle)
- **Theme picker**: Default / Midnight / Ember (radio-style selection)

Persists selections to localStorage (`theme` and `mode` keys) and updates `data-theme` + `data-mode` attributes on `<html>`. Extracted from the UI preview page into a reusable component.

> Note: The old `ThemeProvider` component has been removed. Theme initialization is handled by a blocking inline script in the root layout that reads localStorage before React hydrates.

### NotificationBell

```tsx
import { NotificationBell } from "@/components/ui/notification-bell/notification-bell";

<NotificationBell
  notifications={[
    { id: "1", title: "Shift swap approved", read: false, createdAt: "..." },
    { id: "2", title: "Points threshold reached", read: true, createdAt: "..." },
  ]}
  onMarkRead={(id) => markRead(id)}
  onMarkAllRead={() => markAllRead()}
/>
```

Bell icon with unread count badge. Clicking opens a dropdown list of notifications with mark-read actions.

| Prop | Type | Default |
|------|------|---------|
| `notifications` | `Notification[]` | required |
| `onMarkRead` | `(id: string) => void` | required |
| `onMarkAllRead` | `() => void` | required |

Badge shows unread count; hidden when all are read.

## File Patterns

When creating a new component:

```
src/components/ui/{name}/
  {name}.tsx     Component + types
  {name}.scss    Styles (import tokens, use CSS variables)
```

SCSS file starts with:
```scss
@use "../../../styles/tokens" as *;
```

## Preview

All components are showcased at `/ui` with live theme/mode switching.
