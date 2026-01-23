import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface AddressBody {
  userId: string
  addressType: string
  street1?: string
  street2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  isPrimary?: boolean
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: AddressBody = await request.json()

    const { userId, addressType, street1, street2, city, state, zip, country, isPrimary } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!addressType) {
      return NextResponse.json(
        { error: 'Address type is required' },
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

    // Validate address type
    const validAddressTypes = ['home', 'work', 'mailing', 'billing', 'other']
    if (!validAddressTypes.includes(addressType)) {
      return NextResponse.json(
        { error: `Address type must be one of: ${validAddressTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate optional string fields if provided
    if (street1 !== undefined && (typeof street1 !== 'string' || street1.length > 200)) {
      return NextResponse.json(
        { error: 'Street 1 must be a string with max 200 characters' },
        { status: 400 }
      )
    }

    if (street2 !== undefined && (typeof street2 !== 'string' || street2.length > 200)) {
      return NextResponse.json(
        { error: 'Street 2 must be a string with max 200 characters' },
        { status: 400 }
      )
    }

    if (city !== undefined && (typeof city !== 'string' || city.length > 100)) {
      return NextResponse.json(
        { error: 'City must be a string with max 100 characters' },
        { status: 400 }
      )
    }

    if (state !== undefined && (typeof state !== 'string' || state.length > 50)) {
      return NextResponse.json(
        { error: 'State must be a string with max 50 characters' },
        { status: 400 }
      )
    }

    if (zip !== undefined && (typeof zip !== 'string' || zip.length > 20)) {
      return NextResponse.json(
        { error: 'Zip must be a string with max 20 characters' },
        { status: 400 }
      )
    }

    if (country !== undefined && (typeof country !== 'string' || country.length > 50)) {
      return NextResponse.json(
        { error: 'Country must be a string with max 50 characters' },
        { status: 400 }
      )
    }

    if (isPrimary !== undefined && typeof isPrimary !== 'boolean') {
      return NextResponse.json(
        { error: 'isPrimary must be a boolean' },
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
    const escapedAddressType = addressType.replace(/'/g, "''")
    const escapedStreet1 = street1 ? street1.replace(/'/g, "''") : null
    const escapedStreet2 = street2 ? street2.replace(/'/g, "''") : null
    const escapedCity = city ? city.replace(/'/g, "''") : null
    const escapedState = state ? state.replace(/'/g, "''") : null
    const escapedZip = zip ? zip.replace(/'/g, "''") : null
    const escapedCountry = country ? country.replace(/'/g, "''") : 'US'

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

    // If this address is being set as primary, unset other primary addresses of this type
    if (isPrimary === true) {
      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_directory_address
        SET is_primary = FALSE, updated_at = NOW()
        WHERE directory_id = '${escapedUserId}'
          AND address_type = '${escapedAddressType}'
          AND is_primary = TRUE
      `)
    }

    // Insert new address record
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${tenant}".core_directory_address (
        directory_id, address_type, street_1, street_2, city, state, zip, country, is_primary, created_at, updated_at
      ) VALUES (
        '${escapedUserId}',
        '${escapedAddressType}',
        ${escapedStreet1 ? `'${escapedStreet1}'` : 'NULL'},
        ${escapedStreet2 ? `'${escapedStreet2}'` : 'NULL'},
        ${escapedCity ? `'${escapedCity}'` : 'NULL'},
        ${escapedState ? `'${escapedState}'` : 'NULL'},
        ${escapedZip ? `'${escapedZip}'` : 'NULL'},
        '${escapedCountry}',
        ${isPrimary === true ? 'TRUE' : 'FALSE'},
        NOW(),
        NOW()
      )
    `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('onboarding/address PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update address information' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
