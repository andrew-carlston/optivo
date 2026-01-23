# TenantPreview

Displays a preview of a found tenant with their logo, name, and a success indicator.

## Import

```typescript
import { TenantPreview } from '@/app/(marketing)/find-domain/components'
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `name` | `string` | - | Yes | The tenant's display name |
| `slug` | `string` | - | Yes | The tenant's unique identifier |
| `logo` | `string` | - | No | URL to the tenant's logo image |
| `tagline` | `string` | - | No | Optional tagline or description |

## Examples

### Basic Usage

```tsx
<TenantPreview
  name="Acme Corporation"
  slug="acme-corp"
/>
```

### With Logo

```tsx
<TenantPreview
  name="Acme Corporation"
  slug="acme-corp"
  logo="https://example.com/logos/acme.png"
/>
```

### With Tagline

```tsx
<TenantPreview
  name="Acme Corporation"
  slug="acme-corp"
  logo="https://example.com/logos/acme.png"
  tagline="Building the future, one widget at a time"
/>
```

### In Context (Find Domain Page)

```tsx
import { useFindDomain } from './hooks/useFindDomain'
import { TenantPreview } from './components'

function FindDomainPage() {
  const { tenant, isFound } = useFindDomain()

  return (
    <div>
      {isFound && tenant && (
        <TenantPreview
          name={tenant.name}
          slug={tenant.slug}
          logo={tenant.logo}
          tagline={tenant.tagline}
        />
      )}
    </div>
  )
}
```

## Accessibility

### ARIA Attributes

- `role="region"` - Marks the component as a distinct page region
- `aria-label="Company found"` - Provides context for screen readers
- `aria-hidden="true"` - Applied to decorative success badge icon

### Screen Reader Behavior

The component announces:
1. That a company has been found (via region label)
2. The company name (as heading)
3. The tagline if present
4. The slug identifier
5. The success message: "Company found! Click continue to sign in."

### Focus Management

Focus is not automatically moved to this component. The parent form manages focus flow.

## Visual Structure

```
+------------------------------------------+
|  [Success Badge]                         |
|                                          |
|  [Avatar]  Company Name                  |
|            Optional tagline              |
|            slug-identifier               |
|                                          |
|  Company found! Click continue to sign in|
+------------------------------------------+
```

## Styling

### CSS Module

Located at: `src/app/(marketing)/find-domain/components/TenantPreview.module.sass`

### Key Classes

| Class | Description |
|-------|-------------|
| `.preview` | Main container with border and padding |
| `.successBadge` | Green checkmark indicator |
| `.content` | Flex container for logo and info |
| `.logoWrapper` | Container for Avatar component |
| `.info` | Text content container |
| `.name` | Company name heading |
| `.tagline` | Optional company tagline |
| `.slug` | Code-styled slug display |
| `.foundMessage` | Success message text |

### Design Tokens

Uses project design tokens:
- `--neo-background` - Component background
- `--neo-border` - Border color
- `--neo-accent` - Success indicator color
- `--radius-md` - Border radius

## Dependencies

| Component | Purpose |
|-----------|---------|
| `Avatar` | Displays company logo or placeholder initial |

## Related Components

- [Avatar](/docs/components/Avatar.md) - Used for logo display
- [FormCard](/docs/components/FormCard.md) - Parent container on find-domain page

## Source File

`src/app/(marketing)/find-domain/components/TenantPreview.tsx`
