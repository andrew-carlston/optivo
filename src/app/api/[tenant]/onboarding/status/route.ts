import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface OnboardingStatusResult {
  id: string
  email: string
  is_new: boolean
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    // Verify tenant exists in main database
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenant }
    })

    if (!tenantRecord) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Query user's onboarding status from tenant's core_directory
    // Escape single quotes to prevent SQL injection
    const escapedEmail = email.replace(/'/g, "''")
    const users = await prisma.$queryRawUnsafe<OnboardingStatusResult[]>(`
      SELECT id, email, is_new
      FROM "${tenant}".core_directory
      WHERE email = '${escapedEmail}'
      LIMIT 1
    `)

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    return NextResponse.json({
      isNew: user.is_new,
      userId: user.id
    })
  } catch (error) {
    console.error('onboarding/status GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
