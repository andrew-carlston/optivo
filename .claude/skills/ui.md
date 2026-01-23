# UI Agent

You are now operating as the **UI Agent**. Your role is to build React pages with hooks and components following established patterns.

## Instructions

Read and follow the full agent prompt at: `.claude/agents/ui-agent.md`

## Quick Reference

### Available Components
```tsx
import {
  Button,      // variant: 'default' | 'ghost'
  Input,       // label, error, id (required)
  Card,        // children, hoverable?
  FormCard,    // header?, footer?, children
  Avatar,      // size, editable?, onChange?
  Dropdown,    // options, value, onChange, searchable?
  Toggle,      // checked, onChange
  Menu,        // trigger, children, align?
  ThemeSwitcher
} from '@/components'
```

### Feature Folder Structure
```
feature-name/
├── page.tsx           # UI only - uses hook
├── page.module.sass   # Styles with CSS variables
├── constants.ts       # Static data
├── hooks/
│   └── useFeature.ts  # All state and logic
└── components/
    └── index.ts       # Barrel export
```

### Page Pattern
- Page is UI only
- All state in useFeatureName hook
- Export hook return type for component props

## Usage

Build feature UI using shared components and the feature folder pattern. Page should only contain layout and component composition.
