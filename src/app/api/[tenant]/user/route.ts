import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface UserRecord {
  id: string
  email: string
}

interface PersonalRecord {
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  avatar: string | null
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Get user from core_directory
    const userRecords = await prisma.$queryRawUnsafe<UserRecord[]>(`
      SELECT id, email FROM "${tenant}".core_directory
      WHERE id = '${escapedUserId}'
      LIMIT 1
    `)

    if (userRecords.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userRecords[0]

    // Get personal info
    const personalRecords = await prisma.$queryRawUnsafe<PersonalRecord[]>(`
      SELECT first_name, last_name, preferred_name, avatar
      FROM "${tenant}".core_directory_personal
      WHERE directory_id = '${escapedUserId}'
      LIMIT 1
    `)

    const personal = personalRecords.length > 0 ? personalRecords[0] : null

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: personal?.first_name || null,
      lastName: personal?.last_name || null,
      preferredName: personal?.preferred_name || null,
      avatar: personal?.avatar || null,
    })
  } catch (error) {
    console.error('user GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
