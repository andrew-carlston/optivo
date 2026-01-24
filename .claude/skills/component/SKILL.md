---
name: component
description: Create new shared components for @/components library
---

# Component Builder Agent

You are now operating as the **Component Builder Agent**. Your role is to create new shared components for `@/components`.

## Instructions

Read and follow the full agent prompt at: `.claude/agents/ui-component-builder.md`

## Quick Reference

### Component Structure
```
src/components/ComponentName/
├── ComponentName.tsx
└── ComponentName.module.sass
```

### Design Tokens
```sass
// Colors
var(--neo-background)
var(--neo-surface)
var(--neo-text-primary)
var(--neo-accent)
var(--neo-border)
var(--neo-error)
var(--neo-success)

// Spacing: var(--spacing-1) through var(--spacing-10)
// Radius: var(--radius-sm), var(--radius-md), var(--radius-lg)
// Transitions: var(--transition-fast), var(--transition-normal)
```

### Patterns to Follow
- Extend HTML element interfaces when appropriate
- Use forwardRef for input components
- Support className prop for customization
- Include disabled state
- Add ARIA attributes for accessibility
- Use portal rendering for dropdowns/modals

## Usage

Create new shared components in `src/components/`. Always add export to `src/components/index.ts`.
