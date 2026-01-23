import "dotenv/config"
import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  // Validate slug is provided
  if (!slug) {
    return NextResponse.json({
      found: false,
      error: 'Invalid domain format. Use only lowercase letters, numbers, and hyphens.'
    })
  }

  // Validate slug format (lowercase letters, numbers, and hyphens only)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({
      found: false,
      error: 'Invalid domain format. Use only lowercase letters, numbers, and hyphens.'
    })
  }

  const prisma = createMainPrismaClient()

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        name: true,
        logo: true,
        slug: true
      }
    })

    if (!tenant) {
      return NextResponse.json({
        found: false,
        error: 'Company not found'
      })
    }

    return NextResponse.json({
      found: true,
      tenant: {
        name: tenant.name,
        logo: tenant.logo,
        slug: tenant.slug
      }
    })
  } catch (error) {
    console.error('Error finding domain:', error)
    return NextResponse.json({
      found: false,
      error: 'Unable to verify domain'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
