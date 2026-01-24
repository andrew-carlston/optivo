import { notFound } from 'next/navigation'
import { createMainPrismaClient, createTenantPrismaClient } from '@/lib/tenant-db'
import { AppearanceSettings, defaultAppearance } from '@/types/appearance'
import TenantLayoutClient from './TenantLayoutClient'

// Tenant info passed to children
export interface TenantInfo {
  id: string
  name: string
  slug: string
  logo: string | null
  subtext: string | null
}

// Re-export appearance types for client components
export type { AppearanceSettings }

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

async function getTenant(slug: string): Promise<TenantInfo | null> {
  const prisma = createMainPrismaClient()

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        subtext: true,
      },
    })

    return tenant
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

async function getAppearance(slug: string): Promise<AppearanceSettings> {
  const tenantPrisma = createTenantPrismaClient({ type: 'schema', schema: slug })

  try {
    // First try to ensure the table exists
    try {
      await tenantPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${slug}".core_appearance (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          badge_configs JSONB DEFAULT '${JSON.stringify(defaultAppearance.badge_configs).replace(/'/g, "''")}'::jsonb,
          badge_colors JSONB DEFAULT '${JSON.stringify(defaultAppearance.badge_colors).replace(/'/g, "''")}'::jsonb,
          theme_overrides JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
    } catch {
      // Table creation might fail if schema doesn't exist - that's okay
    }

    // Query the core_appearance table for this tenant
    const result = await tenantPrisma.$queryRawUnsafe<Array<{
      badge_configs: Record<string, unknown>
      badge_colors: Record<string, unknown>
      theme_overrides: Record<string, unknown>
    }>>(`
      SELECT badge_configs, badge_colors, theme_overrides
      FROM "${slug}".core_appearance
      LIMIT 1
    `)

    if (result && result.length > 0) {
      const row = result[0]
      return {
        badge_configs: row.badge_configs as AppearanceSettings['badge_configs'],
        badge_colors: row.badge_colors as AppearanceSettings['badge_colors'],
        theme_overrides: row.theme_overrides as AppearanceSettings['theme_overrides']
      }
    }

    // Return defaults if no appearance record exists
    return defaultAppearance
  } catch (error) {
    // Log error but don't propagate - return defaults instead
    console.warn('Note: Could not fetch appearance settings, using defaults:', (error as Error).message)
    return defaultAppearance
  } finally {
    await tenantPrisma.$disconnect()
  }
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params
  const tenant = await getTenant(tenantSlug)

  if (!tenant) {
    notFound()
  }

  // Fetch appearance settings in parallel (non-blocking)
  const appearance = await getAppearance(tenantSlug)

  return (
    <>
      <script
        id="tenant-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tenant) }}
      />
      <script
        id="appearance-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appearance) }}
      />
      <TenantLayoutClient>{children}</TenantLayoutClient>
    </>
  )
}
