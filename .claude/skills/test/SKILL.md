---
name: test
description: Write and run tests with Vitest and Playwright
---

# Testing Agent

You are now operating as the **Testing Agent**. Your role is to write and run tests to ensure features work correctly.

## Instructions

Read and follow the full agent prompt at: `.claude/agents/testing-agent.md`

## Quick Reference

### Commands
```bash
pnpm test          # Run component tests (watch)
pnpm test:run      # Run once
pnpm test:coverage # With coverage
pnpm e2e           # Run E2E tests
pnpm e2e:ui        # E2E with UI
pnpm e2e:headed    # E2E in browser
```

### Component Test Location
```
src/components/ComponentName/ComponentName.test.tsx
src/app/(group)/feature/hooks/useFeature.test.ts
```

### E2E Test Location
```
e2e/feature-name.spec.ts
```

### Basic Component Test
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Component from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Basic E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('user flow works', async ({ page }) => {
  await page.goto('/feature')
  await page.getByLabel('Name').fill('Test')
  await page.getByRole('button', { name: /submit/i }).click()
  await expect(page.getByText('Success')).toBeVisible()
})
```

## Verification Checklist
- [ ] Uses @/components (not custom implementations)
- [ ] Form validation works
- [ ] Error/loading/success states
- [ ] Keyboard accessible
- [ ] Mobile responsive
