import "dotenv/config"
import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  // Validate slug format (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  }

  try {
    const prisma = createMainPrismaClient()
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    await prisma.$disconnect()

    return NextResponse.json({ available: !existingTenant })
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json({
      available: false,
      error: 'Database error - could not verify slug availability'
    }, { status: 500 })
  }
}
