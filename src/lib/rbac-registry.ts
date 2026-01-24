/**
 * RBAC Resource Registry
 *
 * Dynamic registry for pages and tables that should be controlled by RBAC.
 * Resources register themselves, and the RBAC UI fetches the registry
 * to show available permissions.
 *
 * Usage:
 *
 * // In your page/feature:
 * import { registerPage, registerTable } from '@/lib/rbac-registry'
 *
 * registerPage({
 *   name: 'dashboard',
 *   displayName: 'Dashboard',
 *   description: 'Main dashboard with analytics',
 *   route: '/[tenant]/dashboard',
 *   views: [
 *     { name: 'analytics', displayName: 'Analytics', description: 'View charts' },
 *     { name: 'reports', displayName: 'Reports', description: 'Generate reports' }
 *   ]
 * })
 */

// ============================================================================
// Types
// ============================================================================

export interface PageView {
  name: string
  displayName: string
  description: string
}

export interface RegisteredPage {
  name: string
  displayName: string
  description: string
  route: string
  icon?: string
  views: PageView[]
  registeredAt: string
}

export interface TableColumn {
  name: string
  displayName: string
  description: string
  defaultVisible: boolean
  sensitivity?: 'standard' | 'high' | 'critical'
}

export interface RegisteredTable {
  name: string
  displayName: string
  description: string
  schema?: string // For tenant schema tables
  sensitivity: 'standard' | 'high' | 'critical'
  columns: TableColumn[]
  registeredAt: string
}

export interface RbacResourceRegistry {
  pages: Map<string, RegisteredPage>
  tables: Map<string, RegisteredTable>
}

// ============================================================================
// Registry (in-memory, populated at app startup)
// ============================================================================

const registry: RbacResourceRegistry = {
  pages: new Map(),
  tables: new Map()
}

// ============================================================================
// Page Registration
// ============================================================================

export interface RegisterPageInput {
  name: string
  displayName: string
  description: string
  route: string
  icon?: string
  views?: PageView[]
}

export function registerPage(input: RegisterPageInput): void {
  const page: RegisteredPage = {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    route: input.route,
    icon: input.icon,
    views: input.views || [],
    registeredAt: new Date().toISOString()
  }

  registry.pages.set(input.name, page)
}

export function unregisterPage(name: string): boolean {
  return registry.pages.delete(name)
}

export function getRegisteredPages(): RegisteredPage[] {
  return Array.from(registry.pages.values())
}

export function getRegisteredPage(name: string): RegisteredPage | undefined {
  return registry.pages.get(name)
}

// ============================================================================
// Table Registration
// ============================================================================

export interface RegisterTableColumnInput {
  name: string
  displayName: string
  description: string
  defaultVisible: boolean
  sensitivity?: 'standard' | 'high' | 'critical'
}

export interface RegisterTableInput {
  name: string
  displayName: string
  description: string
  schema?: string
  sensitivity?: 'standard' | 'high' | 'critical'
  columns: RegisterTableColumnInput[]
}

export function registerTable(input: RegisterTableInput): void {
  const tableSensitivity = input.sensitivity || 'standard'
  const table: RegisteredTable = {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    schema: input.schema,
    sensitivity: tableSensitivity,
    columns: input.columns.map(col => ({
      ...col,
      sensitivity: col.sensitivity || tableSensitivity
    })),
    registeredAt: new Date().toISOString()
  }

  registry.tables.set(input.name, table)
}

export function unregisterTable(name: string): boolean {
  return registry.tables.delete(name)
}

export function getRegisteredTables(): RegisteredTable[] {
  return Array.from(registry.tables.values())
}

export function getRegisteredTable(name: string): RegisteredTable | undefined {
  return registry.tables.get(name)
}

// ============================================================================
// Full Registry Access
// ============================================================================

export function getRegistry(): { pages: RegisteredPage[]; tables: RegisteredTable[] } {
  return {
    pages: getRegisteredPages(),
    tables: getRegisteredTables()
  }
}

export function clearRegistry(): void {
  registry.pages.clear()
  registry.tables.clear()
}

// ============================================================================
// Default Registrations (your current app structure)
// ============================================================================

export function registerDefaultResources(): void {
  // Dashboard
  registerPage({
    name: 'dashboard',
    displayName: 'Dashboard',
    description: 'Main dashboard with overview and quick actions',
    route: '/[tenant]/dashboard',
    icon: 'home',
    views: []
  })

  // Settings - with sub-tabs as views
  registerPage({
    name: 'settings',
    displayName: 'Settings',
    description: 'Tenant settings and configuration',
    route: '/[tenant]/settings',
    icon: 'settings',
    views: [
      { name: 'general', displayName: 'General', description: 'Company profile and address' },
      { name: 'billing', displayName: 'Billing', description: 'Plan, payment, and invoices' },
      { name: 'appearance', displayName: 'Appearance', description: 'Badge styles and theme' },
      { name: 'rbac', displayName: 'Roles & Permissions', description: 'Manage user roles' },
      { name: 'danger', displayName: 'Danger Zone', description: 'Delete tenant' }
    ]
  })

  // Add more pages as you build them...
  // registerPage({
  //   name: 'directory',
  //   displayName: 'Directory',
  //   description: 'Employee directory and org chart',
  //   route: '/[tenant]/directory',
  //   icon: 'users',
  //   views: [
  //     { name: 'list', displayName: 'List View', description: 'Table view of employees' },
  //     { name: 'orgChart', displayName: 'Org Chart', description: 'Organization hierarchy' }
  //   ]
  // })
}

// Auto-register defaults when this module is imported
// (you can call this explicitly in your app initialization instead)
if (typeof window === 'undefined') {
  // Server-side only - register defaults
  registerDefaultResources()
}
