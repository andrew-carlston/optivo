import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const { email } = await request.json()

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

    // Check if user exists in tenant's core_directory and get personal info
    // Escape single quotes to prevent SQL injection
    const escapedEmail = email.replace(/'/g, "''")

    interface UserResult {
      id: string
      email: string
      worker_type: string
      status: string
      role: string
      first_name: string | null
      last_name: string | null
      preferred_name: string | null
      avatar: string | null
      title: string | null
    }

    const result = await prisma.$queryRawUnsafe<UserResult[]>(`
      SELECT
        d.id, d.email, d.worker_type, d.status, d.role,
        p.first_name, p.last_name, p.preferred_name, p.avatar, p.title
      FROM "${tenant}".core_directory d
      LEFT JOIN "${tenant}".core_directory_personal p ON p.directory_id = d.id
      WHERE d.email = '${escapedEmail}'
    `)

    const exists = result.length > 0
    const user = exists ? {
      firstName: result[0].first_name,
      lastName: result[0].last_name,
      preferredName: result[0].preferred_name,
      avatar: result[0].avatar,
      title: result[0].title
    } : null

    // Add minimum 100ms delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({ exists, user })
  } catch (error) {
    console.error('user-exists error:', error)
    return NextResponse.json(
      { error: 'Failed to check user existence' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
