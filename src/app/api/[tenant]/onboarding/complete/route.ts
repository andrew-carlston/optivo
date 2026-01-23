import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface CompleteOnboardingBody {
  userId: string
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: CompleteOnboardingBody = await request.json()

    const { userId } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate userId format
    if (typeof userId !== 'string' || userId.length < 1) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
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

    // Escape values to prevent SQL injection
    const escapedUserId = userId.replace(/'/g, "''")

    // Check if user exists in core_directory
    const userExists = await prisma.$queryRawUnsafe<{ id: string; is_new: boolean }[]>(`
      SELECT id, is_new FROM "${tenant}".core_directory
      WHERE id = '${escapedUserId}'
      LIMIT 1
    `)

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has already completed onboarding
    if (!userExists[0].is_new) {
      return NextResponse.json(
        { error: 'User has already completed onboarding' },
        { status: 400 }
      )
    }

    // Update user to mark onboarding as complete
    await prisma.$executeRawUnsafe(`
      UPDATE "${tenant}".core_directory
      SET is_new = FALSE, updated_at = NOW()
      WHERE id = '${escapedUserId}'
    `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('onboarding/complete POST error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
