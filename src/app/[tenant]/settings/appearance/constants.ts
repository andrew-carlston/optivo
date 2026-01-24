/**
 * Appearance Settings Constants
 *
 * Dropdown options and static configuration for badge customization.
 */

export const SHAPE_OPTIONS = [
  { value: 'pill', label: 'Pill' },
  { value: 'square', label: 'Square' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'corner', label: 'Corner' },
] as const

export const FILL_OPTIONS = [
  { value: 'raised', label: 'Raised' },
  { value: 'inset', label: 'Inset' },
  { value: 'outline', label: 'Outline' },
  { value: 'fill', label: 'Fill' },
  { value: 'solid', label: 'Solid' },
] as const

export const LEAF_SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
] as const

export const CORNER_POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
] as const

export const BADGE_COLORS = [
  'default',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
] as const

export const BADGE_TYPE_LABELS: Record<string, { title: string; description: string }> = {
  status: {
    title: 'Status Badges',
    description: 'Used for workflow states, approval status, and task progress.',
  },
  tag: {
    title: 'Tag Badges',
    description: 'Used for categories, labels, and organizational markers.',
  },
  priority: {
    title: 'Priority Badges',
    description: 'Used for urgency and importance levels.',
  },
  label: {
    title: 'Label Badges',
    description: 'Used for general tagging and labeling.',
  },
}

export const SAMPLE_BADGE_TEXT: Record<string, Record<string, string>> = {
  status: {
    default: 'Draft',
    primary: 'In Progress',
    success: 'Approved',
    warning: 'Pending',
    danger: 'Rejected',
    info: 'Under Review',
  },
  tag: {
    default: 'General',
    primary: 'Feature',
    success: 'Complete',
    warning: 'Priority',
    danger: 'Urgent',
    info: 'Documentation',
  },
  priority: {
    default: 'None',
    primary: 'Low',
    success: 'Normal',
    warning: 'High',
    danger: 'Critical',
    info: 'Scheduled',
  },
  label: {
    default: 'Label',
    primary: 'New',
    success: 'Active',
    warning: 'Review',
    danger: 'Blocked',
    info: 'Info',
  },
}
