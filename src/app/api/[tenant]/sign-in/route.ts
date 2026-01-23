import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface CoreDirectoryUser {
  id: string
  email: string
  password: string
  is_new: boolean
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    // Query user by email from tenant's core_directory
    // Escape single quotes to prevent SQL injection
    const escapedEmail = email.replace(/'/g, "''")
    const users = await prisma.$queryRawUnsafe<CoreDirectoryUser[]>(`
      SELECT id, email, password, is_new
      FROM "${tenant}".core_directory
      WHERE email = '${escapedEmail}'
      LIMIT 1
    `)

    const user = users[0]

    // User not found - return generic error to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return success with user data (excluding password)
    // isNew flag at top level for frontend redirect logic
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      isNew: user.is_new
    })
  } catch (error) {
    console.error('sign-in error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
