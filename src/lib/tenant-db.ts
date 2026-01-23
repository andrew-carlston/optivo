import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Tenant Database Service
 *
 * Abstracts tenant database creation to support:
 * 1. PostgreSQL schemas (current implementation)
 * 2. Neon branching (future implementation)
 *
 * To switch to Neon branching later, implement the NeonBranchProvider
 * and update the TENANT_DB_PROVIDER env variable.
 *
 * Table Naming Convention:
 * - Parent/System tables: core_* (e.g., core_tenant, core_settings)
 * - HR module tables: hr_* (e.g., hr_employees, hr_departments)
 * - Finance module tables: fin_* (e.g., fin_invoices, fin_payments)
 * - Inventory module tables: inv_* (e.g., inv_products, inv_warehouses)
 * - Add more prefixes as modules are added
 */

export type TenantDbType = 'schema' | 'neon_branch'

export interface TenantDbConfig {
  type: TenantDbType
  schema?: string      // For schema-based isolation
  branchId?: string    // For Neon branching
  url?: string         // Full connection URL for Neon
}

export interface TenantDbProvider {
  createTenantDb(slug: string): Promise<TenantDbConfig>
  deleteTenantDb(config: TenantDbConfig): Promise<void>
  getTenantConnection(config: TenantDbConfig): string
}

// Schema-based provider (current implementation)
class SchemaProvider implements TenantDbProvider {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createTenantDb(slug: string): Promise<TenantDbConfig> {
    // Create PostgreSQL schema for tenant
    await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}"`)

    // ========================================
    // 1. core_directory (Identity Hub + RBAC)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        password TEXT,

        -- Identity
        worker_type TEXT NOT NULL DEFAULT 'employee',
        status TEXT NOT NULL DEFAULT 'active',

        -- RBAC
        role TEXT NOT NULL DEFAULT 'user',
        permissions JSONB DEFAULT '[]',
        permission_groups TEXT[] DEFAULT '{}',

        -- Flags
        is_new BOOLEAN DEFAULT TRUE,
        is_admin BOOLEAN DEFAULT FALSE,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        terminated_at TIMESTAMP
      )
    `)

    // ========================================
    // 2. core_directory_personal (Personal Info)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_personal (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT UNIQUE NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Name
        first_name TEXT,
        last_name TEXT,
        preferred_name TEXT,

        -- Display
        avatar TEXT,
        title TEXT,

        -- Contact
        phone TEXT,
        phone_type TEXT,
        personal_email TEXT,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ========================================
    // 3. core_directory_employment (Work/Job Info)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_employment (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT UNIQUE NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Organization
        department TEXT,
        team TEXT,
        location TEXT,
        manager_id TEXT REFERENCES "${slug}".core_directory(id),

        -- Role
        job_title TEXT,
        job_code TEXT,
        level TEXT,
        lob TEXT,

        -- Dates
        hire_date DATE,
        start_date DATE,
        end_date DATE,

        -- Classification
        employment_type TEXT,
        flsa_status TEXT,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ========================================
    // 4. core_directory_comp (Compensation)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_comp (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT UNIQUE NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Pay
        pay_type TEXT,
        pay_rate DECIMAL(12,2),
        pay_currency TEXT DEFAULT 'USD',
        pay_frequency TEXT,

        -- Bonus
        bonus_target DECIMAL(12,2),
        bonus_currency TEXT DEFAULT 'USD',

        -- Equity
        equity_shares INTEGER,
        equity_vesting_start DATE,

        -- Effective dates
        effective_date DATE,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ========================================
    // 5. core_directory_hipaa (Sensitive PII)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_hipaa (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT UNIQUE NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Identity (encrypted at rest)
        ssn_encrypted TEXT,
        ssn_last_four TEXT,
        date_of_birth DATE,

        -- Government IDs
        passport_country TEXT,
        passport_encrypted TEXT,
        drivers_license_state TEXT,
        drivers_license_encrypted TEXT,

        -- Emergency Contact
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relation TEXT,

        -- Medical
        blood_type TEXT,
        medical_notes_encrypted TEXT,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ========================================
    // 6. core_directory_contract (Contractor-Specific)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_contract (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT UNIQUE NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Contract
        contract_type TEXT,
        contract_start DATE,
        contract_end DATE,

        -- Vendor/Agency
        vendor_name TEXT,
        vendor_contact TEXT,

        -- Terms
        bill_rate DECIMAL(12,2),
        bill_currency TEXT DEFAULT 'USD',
        payment_terms TEXT,

        -- Compliance
        w9_on_file BOOLEAN DEFAULT FALSE,
        insurance_verified BOOLEAN DEFAULT FALSE,
        background_check_date DATE,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ========================================
    // 7. core_directory_address (Multiple Addresses)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_address (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Type
        address_type TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,

        -- Address
        street_1 TEXT,
        street_2 TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT DEFAULT 'US',

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create partial unique index for primary address constraint
    await this.prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "${slug}_core_directory_address_primary_idx"
      ON "${slug}".core_directory_address (directory_id, address_type)
      WHERE is_primary = TRUE
    `)

    // ========================================
    // 8. core_directory_preferences (User Settings)
    // ========================================
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_directory_preferences (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        directory_id TEXT UNIQUE NOT NULL REFERENCES "${slug}".core_directory(id) ON DELETE CASCADE,

        -- Appearance
        theme TEXT DEFAULT 'system',
        accent_color TEXT,
        badge_style TEXT DEFAULT 'default',

        -- UI Preferences
        table_columns JSONB DEFAULT '{}',
        sidebar_collapsed BOOLEAN DEFAULT FALSE,
        default_view TEXT DEFAULT 'list',

        -- Notifications
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT TRUE,
        notification_frequency TEXT DEFAULT 'instant',

        -- Feature Toggles
        features_enabled JSONB DEFAULT '{}',

        -- Locale
        language TEXT DEFAULT 'en',
        timezone TEXT DEFAULT 'America/Chicago',
        date_format TEXT DEFAULT 'MM/DD/YYYY',

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create core_settings table for tenant company and billing info
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_settings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        -- Company info
        company_name TEXT NOT NULL,
        logo TEXT,
        tagline TEXT,
        industry TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT,
        -- Billing info
        billing_plan TEXT DEFAULT 'free',
        hipaa_compliance BOOLEAN DEFAULT FALSE,
        billing_address TEXT,
        billing_city TEXT,
        billing_state TEXT,
        billing_zip TEXT,
        billing_country TEXT,
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create core_billing_history table for tracking billing changes
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${slug}".core_billing_history (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        -- Change tracking
        action TEXT NOT NULL,
        previous_plan TEXT,
        new_plan TEXT,
        previous_hipaa BOOLEAN,
        new_hipaa BOOLEAN,
        -- Billing address at time of change
        billing_address TEXT,
        billing_city TEXT,
        billing_state TEXT,
        billing_zip TEXT,
        billing_country TEXT,
        -- Metadata
        changed_by TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    return {
      type: 'schema',
      schema: slug,
    }
  }

  async deleteTenantDb(config: TenantDbConfig): Promise<void> {
    if (config.schema) {
      await this.prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${config.schema}" CASCADE`)
    }
  }

  getTenantConnection(config: TenantDbConfig): string {
    // For schema-based, return the base URL with schema search path
    const baseUrl = process.env.DIRECT_URL || ''
    if (config.schema) {
      const url = new URL(baseUrl)
      url.searchParams.set('schema', config.schema)
      return url.toString()
    }
    return baseUrl
  }
}

// Neon Branch provider (future implementation)
class NeonBranchProvider implements TenantDbProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createTenantDb(slug: string): Promise<TenantDbConfig> {
    // TODO: Implement Neon API integration
    // 1. Call Neon API to create a branch from main
    // 2. Get the connection URL for the new branch
    // 3. Run migrations on the new branch
    //
    // Example:
    // const response = await fetch('https://console.neon.tech/api/v2/projects/{project_id}/branches', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.NEON_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     branch: { name: slug },
    //     endpoints: [{ type: 'read_write' }],
    //   }),
    // })
    // const data = await response.json()

    throw new Error('Neon branching not yet implemented. Set TENANT_DB_PROVIDER=schema or implement Neon API integration.')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteTenantDb(config: TenantDbConfig): Promise<void> {
    // TODO: Call Neon API to delete the branch
    throw new Error('Neon branching not yet implemented')
  }

  getTenantConnection(config: TenantDbConfig): string {
    // For Neon branches, return the branch-specific URL
    return config.url || ''
  }
}

// Factory function to get the appropriate provider
export function getTenantDbProvider(prisma: PrismaClient): TenantDbProvider {
  const providerType = process.env.TENANT_DB_PROVIDER || 'schema'

  switch (providerType) {
    case 'neon_branch':
      return new NeonBranchProvider()
    case 'schema':
    default:
      return new SchemaProvider(prisma)
  }
}

// Singleton for main database client (prevents connection pool exhaustion)
let mainPrismaClient: PrismaClient | null = null

// Helper to create a Prisma client for the main database
export function createMainPrismaClient(): PrismaClient {
  // In production, reuse the client. In development, create fresh to avoid stale connections
  if (process.env.NODE_ENV === 'production' && mainPrismaClient) {
    return mainPrismaClient
  }

  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV === 'production') {
    mainPrismaClient = client
  }

  return client
}

// Helper to create a Prisma client for a specific tenant
export function createTenantPrismaClient(config: TenantDbConfig): PrismaClient {
  if (config.type === 'schema' && config.schema) {
    // For schema-based, use the same connection with schema search path
    const adapter = new PrismaPg({
      connectionString: process.env.DIRECT_URL,
    }, {
      schema: config.schema
    })
    return new PrismaClient({ adapter })
  } else if (config.type === 'neon_branch' && config.url) {
    // For Neon branches, use the branch-specific URL
    const adapter = new PrismaPg({ connectionString: config.url })
    return new PrismaClient({ adapter })
  }

  throw new Error('Invalid tenant database configuration')
}
