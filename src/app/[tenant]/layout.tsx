import { notFound } from 'next/navigation'
import { createMainPrismaClient } from '@/lib/tenant-db'

// Tenant info passed to children
export interface TenantInfo {
  id: string
  name: string
  slug: string
  logo: string | null
  subtext: string | null
}

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

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params
  const tenant = await getTenant(tenantSlug)

  if (!tenant) {
    notFound()
  }

  // Clone children with tenant prop
  // Using React.Children and React.cloneElement to pass tenant to page components
  return (
    <>
      {/* Pass tenant data via data attribute for client components to access */}
      <script
        id="tenant-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tenant) }}
      />
      {children}
    </>
  )
}
