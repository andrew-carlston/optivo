/**
 * RBAC (Role-Based Access Control) Types
 *
 * Type definitions for the tenant-specific RBAC system including roles,
 * permissions, data scopes, and tag/label access control.
 */

// ============================================================================
// Tag Types
// ============================================================================

/**
 * RBAC Tag - categorization tags for permissions and roles
 */
export interface RbacTag {
  id: string
  name: string
  displayName: string
  description: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Database row type for core_rbac_tags table
 */
export interface RbacTagRow {
  id: string
  name: string
  display_name: string
  description: string | null
  is_archived: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Request payload for creating a new tag
 */
export interface CreateTagRequest {
  name?: string
  displayName: string
  description?: string | null
}

/**
 * Request payload for updating a tag
 */
export interface UpdateTagRequest {
  name?: string
  displayName?: string
  description?: string | null
  isArchived?: boolean
}

/**
 * Convert database row to RbacTag interface
 */
export function rowToTag(row: RbacTagRow): RbacTag {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    isArchived: row.is_archived,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }
}

// ============================================================================
// Role Types
// ============================================================================

/**
 * Available icons for role cards
 */
export type RoleIcon = 'crown' | 'shield' | 'briefcase' | 'user' | 'eye' | 'lock' | 'star'

/**
 * Valid role icons array for validation
 */
export const VALID_ROLE_ICONS: RoleIcon[] = ['crown', 'shield', 'briefcase', 'user', 'eye', 'lock', 'star']

/**
 * Role Group - organizational grouping with base permissions
 */
export interface RoleGroup {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string
  icon: RoleIcon
  priority: number
  createdAt: string
  updatedAt: string
  permissions?: GroupPermissions
  roleCount?: number
}

/**
 * Group permissions - base permissions inherited by all roles in the group
 */
export interface GroupPermissions {
  id: string
  groupId: string
  pagePermissions: PagePermissions
  tablePermissions: TablePermissions
  dataScope: DataScope
  createdAt: string
  updatedAt: string
}

/**
 * Role definition with metadata and optional permissions
 */
export interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string
  icon: RoleIcon
  isSystemRole: boolean
  isDefault: boolean
  groupId: string | null  // Group membership
  parentRoleId: string | null  // Hierarchy (reports to)
  priority: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
  memberCount?: number
  tags?: string[]  // Assignable tags (from permissions)
  permissions?: RolePermissions
}

// ============================================================================
// Page Permissions
// ============================================================================

/**
 * Detailed permissions for a single view
 */
export interface ViewPermissionDetails {
  enabled: boolean
  canEdit?: boolean
  canDelete?: boolean
  canAdd?: boolean
  archive?: boolean
}

/**
 * Permission for a single page with optional view-level access and scope
 */
export interface PageViewPermission {
  access: boolean
  scope?: ScopeType  // Per-page scope override
  views?: Record<string, boolean | ViewPermissionDetails>
}

/**
 * Page permissions mapped by page name
 */
export interface PagePermissions {
  [pageName: string]: PageViewPermission
}

/**
 * Definition of a page and its available views
 */
export interface PageDefinition {
  name: string
  displayName: string
  description: string
  views: {
    name: string
    displayName: string
    description: string
  }[]
}

/**
 * All pages and their views available in the application
 */
export const PAGE_DEFINITIONS: PageDefinition[] = [
  {
    name: 'dashboard',
    displayName: 'Dashboard',
    description: 'Main dashboard with analytics and quick actions',
    views: [
      { name: 'analytics', displayName: 'Analytics', description: 'View analytics charts and metrics' },
      { name: 'reports', displayName: 'Reports', description: 'Access and generate reports' },
      { name: 'activity', displayName: 'Activity', description: 'View activity feed and history' }
    ]
  },
  {
    name: 'directory',
    displayName: 'Directory',
    description: 'Employee directory and organization structure',
    views: [
      { name: 'list', displayName: 'List View', description: 'View employees in table format' },
      { name: 'orgChart', displayName: 'Org Chart', description: 'View organization hierarchy' },
      { name: 'cards', displayName: 'Cards View', description: 'View employees as cards' }
    ]
  },
  {
    name: 'settings',
    displayName: 'Settings',
    description: 'Application and tenant settings',
    views: [
      { name: 'general', displayName: 'General', description: 'General tenant settings' },
      { name: 'appearance', displayName: 'Appearance', description: 'Theme and visual customization' },
      { name: 'rbac', displayName: 'Roles & Permissions', description: 'Manage roles and access control' },
      { name: 'integrations', displayName: 'Integrations', description: 'Third-party integrations' }
    ]
  }
]

// ============================================================================
// Table/Column Permissions
// ============================================================================

/**
 * Permission for a single table with column-level visibility
 */
export interface TablePermission {
  visible: boolean
  columns: Record<string, boolean>
}

/**
 * Table permissions mapped by table name
 */
export interface TablePermissions {
  [tableName: string]: TablePermission
}

/**
 * Sensitivity level for directory tables
 */
export type SensitivityLevel = 'standard' | 'high' | 'critical'

/**
 * Column definition within a directory table
 */
export interface ColumnDefinition {
  name: string
  displayName: string
  description: string
  defaultVisible: boolean
}

/**
 * Definition of a directory table and its columns
 */
export interface DirectoryTableDefinition {
  name: string
  displayName: string
  description: string
  sensitivity: SensitivityLevel
  columns: ColumnDefinition[]
}

/**
 * All directory tables and their columns (7 tables)
 */
export const DIRECTORY_TABLES: DirectoryTableDefinition[] = [
  {
    name: 'core_directory',
    displayName: 'Core Directory',
    description: 'Basic employee information visible across the organization',
    sensitivity: 'standard',
    columns: [
      { name: 'email', displayName: 'Email', description: 'Work email address', defaultVisible: true },
      { name: 'first_name', displayName: 'First Name', description: 'Legal first name', defaultVisible: true },
      { name: 'last_name', displayName: 'Last Name', description: 'Legal last name', defaultVisible: true },
      { name: 'preferred_name', displayName: 'Preferred Name', description: 'Preferred/display name', defaultVisible: true },
      { name: 'job_title', displayName: 'Job Title', description: 'Current job title', defaultVisible: true },
      { name: 'department', displayName: 'Department', description: 'Department assignment', defaultVisible: true },
      { name: 'location', displayName: 'Location', description: 'Work location', defaultVisible: true },
      { name: 'phone', displayName: 'Phone', description: 'Work phone number', defaultVisible: true },
      { name: 'avatar_url', displayName: 'Avatar', description: 'Profile photo', defaultVisible: true },
      { name: 'manager_id', displayName: 'Manager', description: 'Direct manager', defaultVisible: true }
    ]
  },
  {
    name: 'personal_info',
    displayName: 'Personal Information',
    description: 'Personal contact and demographic information',
    sensitivity: 'standard',
    columns: [
      { name: 'personal_email', displayName: 'Personal Email', description: 'Personal email address', defaultVisible: false },
      { name: 'personal_phone', displayName: 'Personal Phone', description: 'Personal phone number', defaultVisible: false },
      { name: 'date_of_birth', displayName: 'Date of Birth', description: 'Birth date', defaultVisible: false },
      { name: 'address', displayName: 'Home Address', description: 'Residential address', defaultVisible: false },
      { name: 'emergency_contact', displayName: 'Emergency Contact', description: 'Emergency contact details', defaultVisible: true },
      { name: 'nationality', displayName: 'Nationality', description: 'Country of citizenship', defaultVisible: false },
      { name: 'marital_status', displayName: 'Marital Status', description: 'Marital status', defaultVisible: false }
    ]
  },
  {
    name: 'employment',
    displayName: 'Employment Details',
    description: 'Employment history and job-related information',
    sensitivity: 'standard',
    columns: [
      { name: 'employee_id', displayName: 'Employee ID', description: 'Internal employee number', defaultVisible: true },
      { name: 'hire_date', displayName: 'Hire Date', description: 'Date of hire', defaultVisible: true },
      { name: 'employment_type', displayName: 'Employment Type', description: 'Full-time, part-time, contractor', defaultVisible: true },
      { name: 'employment_status', displayName: 'Status', description: 'Active, on leave, terminated', defaultVisible: true },
      { name: 'termination_date', displayName: 'Termination Date', description: 'Date of termination', defaultVisible: false },
      { name: 'termination_reason', displayName: 'Termination Reason', description: 'Reason for leaving', defaultVisible: false },
      { name: 'work_schedule', displayName: 'Work Schedule', description: 'Working hours/schedule', defaultVisible: true },
      { name: 'remote_status', displayName: 'Remote Status', description: 'Remote, hybrid, on-site', defaultVisible: true }
    ]
  },
  {
    name: 'compensation',
    displayName: 'Compensation',
    description: 'Salary, benefits, and financial information',
    sensitivity: 'high',
    columns: [
      { name: 'salary', displayName: 'Salary', description: 'Base salary amount', defaultVisible: false },
      { name: 'salary_currency', displayName: 'Currency', description: 'Salary currency', defaultVisible: false },
      { name: 'pay_frequency', displayName: 'Pay Frequency', description: 'Weekly, bi-weekly, monthly', defaultVisible: false },
      { name: 'bonus_eligible', displayName: 'Bonus Eligible', description: 'Eligible for bonus', defaultVisible: false },
      { name: 'bonus_target', displayName: 'Bonus Target', description: 'Target bonus percentage', defaultVisible: false },
      { name: 'equity_grants', displayName: 'Equity Grants', description: 'Stock options/RSUs', defaultVisible: false },
      { name: 'last_raise_date', displayName: 'Last Raise Date', description: 'Date of last salary increase', defaultVisible: false },
      { name: 'last_raise_amount', displayName: 'Last Raise Amount', description: 'Amount of last increase', defaultVisible: false }
    ]
  },
  {
    name: 'benefits',
    displayName: 'Benefits',
    description: 'Health insurance and benefit enrollments',
    sensitivity: 'high',
    columns: [
      { name: 'health_plan', displayName: 'Health Plan', description: 'Medical insurance plan', defaultVisible: false },
      { name: 'dental_plan', displayName: 'Dental Plan', description: 'Dental insurance plan', defaultVisible: false },
      { name: 'vision_plan', displayName: 'Vision Plan', description: 'Vision insurance plan', defaultVisible: false },
      { name: 'life_insurance', displayName: 'Life Insurance', description: 'Life insurance coverage', defaultVisible: false },
      { name: 'retirement_plan', displayName: 'Retirement Plan', description: '401k/pension enrollment', defaultVisible: false },
      { name: 'pto_balance', displayName: 'PTO Balance', description: 'Available paid time off', defaultVisible: false },
      { name: 'sick_leave_balance', displayName: 'Sick Leave', description: 'Available sick leave', defaultVisible: false }
    ]
  },
  {
    name: 'hipaa',
    displayName: 'HIPAA Protected',
    description: 'Health-related protected information',
    sensitivity: 'critical',
    columns: [
      { name: 'disability_status', displayName: 'Disability Status', description: 'Disability accommodation status', defaultVisible: false },
      { name: 'accommodation_needs', displayName: 'Accommodations', description: 'Required workplace accommodations', defaultVisible: false },
      { name: 'medical_leave_history', displayName: 'Medical Leave', description: 'Medical leave records', defaultVisible: false },
      { name: 'fmla_status', displayName: 'FMLA Status', description: 'FMLA eligibility and usage', defaultVisible: false },
      { name: 'workers_comp_claims', displayName: 'Workers Comp', description: 'Workers compensation claims', defaultVisible: false }
    ]
  },
  {
    name: 'documents',
    displayName: 'Documents',
    description: 'Employee documents and files',
    sensitivity: 'high',
    columns: [
      { name: 'id_documents', displayName: 'ID Documents', description: 'Identity verification documents', defaultVisible: false },
      { name: 'tax_forms', displayName: 'Tax Forms', description: 'W-4, W-2, and tax documents', defaultVisible: false },
      { name: 'contracts', displayName: 'Contracts', description: 'Employment contracts', defaultVisible: false },
      { name: 'performance_reviews', displayName: 'Performance Reviews', description: 'Performance review documents', defaultVisible: false },
      { name: 'certifications', displayName: 'Certifications', description: 'Professional certifications', defaultVisible: true },
      { name: 'training_records', displayName: 'Training Records', description: 'Completed training', defaultVisible: true }
    ]
  }
]

// ============================================================================
// Data Scope Types
// ============================================================================

/**
 * Type of data scope for directory visibility
 */
export type ScopeType = 'self' | 'direct_reports' | 'department' | 'all'

/**
 * Valid scope types array for validation
 */
export const VALID_SCOPE_TYPES: ScopeType[] = ['self', 'direct_reports', 'department', 'all']

/**
 * Data scope configuration for controlling who a role can see
 */
export interface DataScope {
  scopeType: ScopeType
  includeIndirectReports: boolean
  includeCrossDepartment: boolean
  excludeTerminated: boolean
}

/**
 * Data scope option definition for UI rendering
 */
export interface DataScopeOption {
  value: ScopeType
  label: string
  description: string
}

/**
 * Available data scope options for the UI
 */
export const DATA_SCOPE_OPTIONS: DataScopeOption[] = [
  {
    value: 'self',
    label: 'Self Only',
    description: 'Can only view and edit their own profile'
  },
  {
    value: 'direct_reports',
    label: 'Direct Reports',
    description: 'Self + employees who report directly to them'
  },
  {
    value: 'department',
    label: 'Department',
    description: 'All employees in their same department'
  },
  {
    value: 'all',
    label: 'All Company',
    description: 'All employees in the organization'
  }
]

// ============================================================================
// Tag & Label Permissions
// ============================================================================

/**
 * Permissions for managing tags
 */
export interface TagPermissions {
  canCreateTags: boolean
  canEditTags: boolean
  canDeleteTags: boolean
  visibleTags: string[] | null // null = all tags visible
  editableTags: string[] | null // null = all tags editable
}

/**
 * Permissions for managing labels
 */
export interface LabelPermissions {
  canCreateLabels: boolean
  canEditLabels: boolean
  canDeleteLabels: boolean
  visibleLabels: string[] | null // null = all labels visible
  editableLabels: string[] | null // null = all labels editable
}

// ============================================================================
// Combined Role Permissions
// ============================================================================

/**
 * Complete permissions object for a role
 */
export interface RolePermissions {
  id: string
  roleId: string
  pagePermissions: PagePermissions
  tablePermissions: TablePermissions
  dataScope: DataScope
  tagPermissions?: TagPermissions  // Optional, moving to tags array
  labelPermissions?: LabelPermissions  // Optional, moving to tags array
  tags?: string[]  // Assignable tags for this role
  cascadeToChildren: boolean
  inheritFromParent: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request payload for creating a new group
 */
export interface CreateGroupRequest {
  name: string
  displayName: string
  description?: string | null
  color?: string
  icon?: RoleIcon
  priority?: number
}

/**
 * Request payload for updating a group
 */
export interface UpdateGroupRequest {
  displayName?: string
  description?: string | null
  color?: string
  icon?: RoleIcon
  priority?: number
}

/**
 * Request payload for creating a new role
 */
export interface CreateRoleRequest {
  name: string
  displayName: string
  description?: string | null
  color?: string
  icon?: RoleIcon
  isDefault?: boolean
  groupId?: string | null
  parentRoleId?: string | null
  priority?: number
  permissions?: Partial<Omit<RolePermissions, 'id' | 'roleId' | 'createdAt' | 'updatedAt'>>
}

/**
 * Request payload for updating an existing role
 */
export interface UpdateRoleRequest {
  displayName?: string
  description?: string | null
  color?: string
  icon?: RoleIcon
  isDefault?: boolean
  parentRoleId?: string | null
  priority?: number
}

/**
 * Request payload for updating role permissions
 */
export interface UpdatePermissionsRequest {
  pagePermissions?: PagePermissions
  tablePermissions?: TablePermissions
  dataScope?: Partial<DataScope>
  tagPermissions?: Partial<TagPermissions>
  labelPermissions?: Partial<LabelPermissions>
  cascadeToChildren?: boolean
  inheritFromParent?: boolean
}

/**
 * API response for role operations
 */
export interface RoleApiResponse {
  success: boolean
  data?: Role
  error?: string
}

/**
 * API response for listing roles
 */
export interface RolesListResponse {
  success: boolean
  data?: Role[]
  error?: string
}

/**
 * API response for permissions operations
 */
export interface PermissionsApiResponse {
  success: boolean
  data?: RolePermissions
  error?: string
}

// ============================================================================
// Legacy API Types (snake_case for backward compatibility)
// ============================================================================

/**
 * Role in snake_case format (for API responses)
 */
export interface RbacRole {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  icon: string
  is_system_role: boolean
  is_default: boolean
  parent_role_id: string | null
  priority: number
  created_at: string
  updated_at: string
}

/**
 * Role with member count (for API responses)
 */
export interface RbacRoleWithMemberCount extends RbacRole {
  member_count: number
}

/**
 * Permissions in snake_case format (for API responses)
 */
export interface RbacPermissions {
  id: string
  role_id: string
  page_permissions: PagePermissions
  table_permissions: TablePermissions
  data_scope: DataScope
  tag_permissions: TagPermissions
  label_permissions: LabelPermissions
  cascade_to_children: boolean
  inherit_from_parent: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// Database Row Types (for raw SQL queries)
// ============================================================================

/**
 * Database row type for core_rbac_roles table
 */
export interface RbacRoleRow {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  icon: string
  is_system_role: boolean
  is_default: boolean
  parent_role_id: string | null
  priority: number
  created_by: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Database row type with member count from join
 */
export interface RbacRoleWithCountRow extends RbacRoleRow {
  member_count: bigint
}

/**
 * Database row type for core_rbac_permissions table
 */
export interface RbacPermissionsRow {
  id: string
  role_id: string
  page_permissions: PagePermissions | null
  table_permissions: TablePermissions | null
  data_scope: DataScope | null
  tag_permissions: TagPermissions | null
  label_permissions: LabelPermissions | null
  cascade_to_children: boolean
  inherit_from_parent: boolean
  created_at: Date
  updated_at: Date
}

// ============================================================================
// Default Constants
// ============================================================================

/**
 * Default page permissions for new roles (minimal access)
 */
export const DEFAULT_PAGE_PERMISSIONS: PagePermissions = {
  dashboard: { access: true, views: { analytics: true, reports: false, activity: false } },
  directory: { access: true, views: { list: true, orgChart: false, cards: false } },
  settings: { access: false, views: { general: false, appearance: false, rbac: false, integrations: false } }
}

/**
 * Default table permissions for new roles (basic visibility)
 */
export const DEFAULT_TABLE_PERMISSIONS: TablePermissions = {
  core_directory: {
    visible: true,
    columns: {
      email: true,
      first_name: true,
      last_name: true,
      preferred_name: true,
      job_title: true,
      department: true,
      location: true,
      phone: false,
      avatar_url: true,
      manager_id: true
    }
  },
  personal_info: { visible: false, columns: {} },
  employment: {
    visible: true,
    columns: {
      employee_id: true,
      hire_date: true,
      employment_type: true,
      employment_status: true,
      termination_date: false,
      termination_reason: false,
      work_schedule: false,
      remote_status: true
    }
  },
  compensation: { visible: false, columns: {} },
  benefits: { visible: false, columns: {} },
  hipaa: { visible: false, columns: {} },
  documents: { visible: false, columns: {} }
}

/**
 * Default data scope for new roles
 */
export const DEFAULT_DATA_SCOPE: DataScope = {
  scopeType: 'self',
  includeIndirectReports: false,
  includeCrossDepartment: false,
  excludeTerminated: true
}

/**
 * Default tag permissions for new roles
 */
export const DEFAULT_TAG_PERMISSIONS: TagPermissions = {
  canCreateTags: false,
  canEditTags: false,
  canDeleteTags: false,
  visibleTags: null,
  editableTags: []
}

/**
 * Default label permissions for new roles
 */
export const DEFAULT_LABEL_PERMISSIONS: LabelPermissions = {
  canCreateLabels: false,
  canEditLabels: false,
  canDeleteLabels: false,
  visibleLabels: null,
  editableLabels: []
}

/**
 * Complete default permissions for new roles
 */
export const DEFAULT_PERMISSIONS: Omit<RolePermissions, 'id' | 'roleId' | 'createdAt' | 'updatedAt'> = {
  pagePermissions: DEFAULT_PAGE_PERMISSIONS,
  tablePermissions: DEFAULT_TABLE_PERMISSIONS,
  dataScope: DEFAULT_DATA_SCOPE,
  tagPermissions: DEFAULT_TAG_PERMISSIONS,
  labelPermissions: DEFAULT_LABEL_PERMISSIONS,
  cascadeToChildren: true,
  inheritFromParent: true
}

// ============================================================================
// Super Admin Constants
// ============================================================================

/**
 * Super Admin page permissions (full access)
 */
export const SUPER_ADMIN_PAGE_PERMISSIONS: PagePermissions = {
  dashboard: { access: true, views: { analytics: true, reports: true, activity: true } },
  directory: { access: true, views: { list: true, orgChart: true, cards: true } },
  settings: { access: true, views: { general: true, appearance: true, rbac: true, integrations: true } }
}

/**
 * Super Admin table permissions (full access to all tables and columns)
 */
export const SUPER_ADMIN_TABLE_PERMISSIONS: TablePermissions = {
  core_directory: {
    visible: true,
    columns: {
      email: true,
      first_name: true,
      last_name: true,
      preferred_name: true,
      job_title: true,
      department: true,
      location: true,
      phone: true,
      avatar_url: true,
      manager_id: true
    }
  },
  personal_info: {
    visible: true,
    columns: {
      personal_email: true,
      personal_phone: true,
      date_of_birth: true,
      address: true,
      emergency_contact: true,
      nationality: true,
      marital_status: true
    }
  },
  employment: {
    visible: true,
    columns: {
      employee_id: true,
      hire_date: true,
      employment_type: true,
      employment_status: true,
      termination_date: true,
      termination_reason: true,
      work_schedule: true,
      remote_status: true
    }
  },
  compensation: {
    visible: true,
    columns: {
      salary: true,
      salary_currency: true,
      pay_frequency: true,
      bonus_eligible: true,
      bonus_target: true,
      equity_grants: true,
      last_raise_date: true,
      last_raise_amount: true
    }
  },
  benefits: {
    visible: true,
    columns: {
      health_plan: true,
      dental_plan: true,
      vision_plan: true,
      life_insurance: true,
      retirement_plan: true,
      pto_balance: true,
      sick_leave_balance: true
    }
  },
  hipaa: {
    visible: true,
    columns: {
      disability_status: true,
      accommodation_needs: true,
      medical_leave_history: true,
      fmla_status: true,
      workers_comp_claims: true
    }
  },
  documents: {
    visible: true,
    columns: {
      id_documents: true,
      tax_forms: true,
      contracts: true,
      performance_reviews: true,
      certifications: true,
      training_records: true
    }
  }
}

/**
 * Super Admin data scope (full access)
 */
export const SUPER_ADMIN_DATA_SCOPE: DataScope = {
  scopeType: 'all',
  includeIndirectReports: true,
  includeCrossDepartment: true,
  excludeTerminated: false
}

/**
 * Super Admin tag permissions (full access)
 */
export const SUPER_ADMIN_TAG_PERMISSIONS: TagPermissions = {
  canCreateTags: true,
  canEditTags: true,
  canDeleteTags: true,
  visibleTags: null,
  editableTags: null
}

/**
 * Super Admin label permissions (full access)
 */
export const SUPER_ADMIN_LABEL_PERMISSIONS: LabelPermissions = {
  canCreateLabels: true,
  canEditLabels: true,
  canDeleteLabels: true,
  visibleLabels: null,
  editableLabels: null
}

/**
 * Complete Super Admin permissions (full access to everything)
 */
export const SUPER_ADMIN_PERMISSIONS: Omit<RolePermissions, 'id' | 'roleId' | 'createdAt' | 'updatedAt'> = {
  pagePermissions: SUPER_ADMIN_PAGE_PERMISSIONS,
  tablePermissions: SUPER_ADMIN_TABLE_PERMISSIONS,
  dataScope: SUPER_ADMIN_DATA_SCOPE,
  tagPermissions: SUPER_ADMIN_TAG_PERMISSIONS,
  labelPermissions: SUPER_ADMIN_LABEL_PERMISSIONS,
  cascadeToChildren: false,
  inheritFromParent: false
}

/**
 * Default Super Admin role definition
 */
export const SUPER_ADMIN_ROLE: Omit<Role, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'super_admin',
  displayName: 'Super Admin',
  description: 'Full access to all features and data. Cannot be deleted or modified.',
  color: '#7c3aed',
  icon: 'crown',
  isSystemRole: true,
  isDefault: false,
  groupId: null,
  parentRoleId: null,
  priority: 1000,
  createdBy: null
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Role with permissions loaded
 */
export type RoleWithPermissions = Role & { permissions: RolePermissions }

/**
 * Partial role for form state
 */
export type RoleFormData = Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystemRole' | 'memberCount'>>

/**
 * Partial permissions for form state
 */
export type PermissionsFormData = Partial<Omit<RolePermissions, 'id' | 'roleId' | 'createdAt' | 'updatedAt'>>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert database row to Role interface (snake_case to camelCase)
 */
export function rowToRole(row: (RbacRoleRow | RbacRoleWithCountRow) & { group_id?: string | null }): Role {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    color: row.color,
    icon: row.icon as RoleIcon,
    isSystemRole: row.is_system_role,
    isDefault: row.is_default,
    groupId: row.group_id || null,
    parentRoleId: row.parent_role_id,
    priority: row.priority,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    memberCount: 'member_count' in row ? Number(row.member_count) : undefined
  }
}

/**
 * Convert database row to RolePermissions interface
 */
export function rowToPermissions(row: RbacPermissionsRow): RolePermissions {
  return {
    id: row.id,
    roleId: row.role_id,
    pagePermissions: row.page_permissions ?? DEFAULT_PAGE_PERMISSIONS,
    tablePermissions: row.table_permissions ?? DEFAULT_TABLE_PERMISSIONS,
    dataScope: row.data_scope ?? DEFAULT_DATA_SCOPE,
    tagPermissions: row.tag_permissions ?? DEFAULT_TAG_PERMISSIONS,
    labelPermissions: row.label_permissions ?? DEFAULT_LABEL_PERMISSIONS,
    cascadeToChildren: row.cascade_to_children,
    inheritFromParent: row.inherit_from_parent,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }
}

/**
 * Generate a URL-safe slug from a display name
 */
export function generateRoleSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
