import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface PersonalInfoBody {
  userId: string
  firstName?: string
  lastName?: string
  preferredName?: string
  phone?: string
  phoneType?: string
  avatar?: string
}

interface ExistingPersonalRecord {
  id: string
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: PersonalInfoBody = await request.json()

    const { userId, firstName, lastName, preferredName, phone, phoneType, avatar } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate userId format (should be a valid UUID-like string)
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

    // Validate optional string fields if provided
    if (firstName !== undefined && (typeof firstName !== 'string' || firstName.length > 100)) {
      return NextResponse.json(
        { error: 'First name must be a string with max 100 characters' },
        { status: 400 }
      )
    }

    if (lastName !== undefined && (typeof lastName !== 'string' || lastName.length > 100)) {
      return NextResponse.json(
        { error: 'Last name must be a string with max 100 characters' },
        { status: 400 }
      )
    }

    if (preferredName !== undefined && (typeof preferredName !== 'string' || preferredName.length > 100)) {
      return NextResponse.json(
        { error: 'Preferred name must be a string with max 100 characters' },
        { status: 400 }
      )
    }

    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 20)) {
      return NextResponse.json(
        { error: 'Phone must be a string with max 20 characters' },
        { status: 400 }
      )
    }

    const validPhoneTypes = ['mobile', 'home', 'work', 'other']
    if (phoneType !== undefined && !validPhoneTypes.includes(phoneType)) {
      return NextResponse.json(
        { error: `Phone type must be one of: ${validPhoneTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 500)) {
      return NextResponse.json(
        { error: 'Avatar URL must be a string with max 500 characters' },
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
    const escapedFirstName = firstName ? firstName.replace(/'/g, "''") : null
    const escapedLastName = lastName ? lastName.replace(/'/g, "''") : null
    const escapedPreferredName = preferredName ? preferredName.replace(/'/g, "''") : null
    const escapedPhone = phone ? phone.replace(/'/g, "''") : null
    const escapedPhoneType = phoneType ? phoneType.replace(/'/g, "''") : null
    const escapedAvatar = avatar ? avatar.replace(/'/g, "''") : null

    // Check if user exists in core_directory
    const userExists = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "${tenant}".core_directory
      WHERE id = '${escapedUserId}'
      LIMIT 1
    `)

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if personal record already exists
    const existingRecord = await prisma.$queryRawUnsafe<ExistingPersonalRecord[]>(`
      SELECT id FROM "${tenant}".core_directory_personal
      WHERE directory_id = '${escapedUserId}'
      LIMIT 1
    `)

    if (existingRecord.length > 0) {
      // Update existing record
      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_directory_personal
        SET
          first_name = ${escapedFirstName ? `'${escapedFirstName}'` : 'first_name'},
          last_name = ${escapedLastName ? `'${escapedLastName}'` : 'last_name'},
          preferred_name = ${escapedPreferredName ? `'${escapedPreferredName}'` : 'preferred_name'},
          phone = ${escapedPhone ? `'${escapedPhone}'` : 'phone'},
          phone_type = ${escapedPhoneType ? `'${escapedPhoneType}'` : 'phone_type'},
          avatar = ${escapedAvatar ? `'${escapedAvatar}'` : 'avatar'},
          updated_at = NOW()
        WHERE directory_id = '${escapedUserId}'
      `)
    } else {
      // Insert new record
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenant}".core_directory_personal (
          directory_id, first_name, last_name, preferred_name, phone, phone_type, avatar, created_at, updated_at
        ) VALUES (
          '${escapedUserId}',
          ${escapedFirstName ? `'${escapedFirstName}'` : 'NULL'},
          ${escapedLastName ? `'${escapedLastName}'` : 'NULL'},
          ${escapedPreferredName ? `'${escapedPreferredName}'` : 'NULL'},
          ${escapedPhone ? `'${escapedPhone}'` : 'NULL'},
          ${escapedPhoneType ? `'${escapedPhoneType}'` : 'NULL'},
          ${escapedAvatar ? `'${escapedAvatar}'` : 'NULL'},
          NOW(),
          NOW()
        )
      `)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('onboarding/personal PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update personal information' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
