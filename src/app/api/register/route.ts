import "dotenv/config"
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { createMainPrismaClient, getTenantDbProvider } from '@/lib/tenant-db'

export async function POST(request: NextRequest) {
  const prisma = createMainPrismaClient()

  try {
    const {
      companyName,
      slug,
      logo,
      subtext,
      industry,
      // Company address
      address,
      city,
      state,
      zip,
      country,
      // Billing
      billingPlan,
      hipaaCompliance,
      billingAddress,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      // Account
      email,
      password,
      confirmPassword,
      // Admin user info
      firstName,
      lastName
    } = await request.json()

    // Basic validation
    if (!companyName || !slug || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug can only contain lowercase letters, numbers, and hyphens' }, { status: 400 })
    }

    // Check if slug already exists
    const existingSlug = await prisma.tenant.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Company name generates a duplicate slug' }, { status: 400 })
    }

    // Check if email already exists in core_tenant
    const existingEmail = await prisma.tenant.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create tenant database (schema or Neon branch based on config)
    const dbProvider = getTenantDbProvider(prisma)
    const dbConfig = await dbProvider.createTenantDb(slug)

    // Create tenant with billing in a transaction
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        email,
        logo: logo || null,
        subtext: subtext || null,
        industry: industry || null,
        // Company address
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        country: country || null,
        // Database config
        dbType: dbConfig.type,
        dbSchema: dbConfig.schema,
        dbBranchId: dbConfig.branchId,
        dbUrl: dbConfig.url,
        // Billing relation
        billing: {
          create: {
            plan: billingPlan || 'free',
            hipaaCompliance: hipaaCompliance || false,
            address: billingAddress || null,
            city: billingCity || null,
            state: billingState || null,
            zip: billingZip || null,
            country: billingCountry || null,
          }
        }
      },
      include: {
        billing: true
      }
    })

    // Create admin user in tenant's core_directory table
    // Use ON CONFLICT to handle cases where schema already has this email (from partial registration)
    const escapedEmail = email.replace(/'/g, "''")
    const directoryResult = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      INSERT INTO "${slug}".core_directory (email, password, is_new, role, is_admin, worker_type, status)
      VALUES ('${escapedEmail}', '${hashedPassword}', TRUE, 'super_admin', TRUE, 'employee', 'active')
      ON CONFLICT (email) DO UPDATE SET
        password = '${hashedPassword}',
        is_new = TRUE,
        role = 'super_admin',
        is_admin = TRUE,
        updated_at = NOW()
      RETURNING id
    `)

    const directoryId = directoryResult[0]?.id

    // Create personal info record for admin user
    if (directoryId) {
      const escapedFirstName = firstName ? `'${firstName.replace(/'/g, "''")}'` : 'NULL'
      const escapedLastName = lastName ? `'${lastName.replace(/'/g, "''")}'` : 'NULL'

      await prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".core_directory_personal (directory_id, first_name, last_name)
        VALUES ('${directoryId}', ${escapedFirstName}, ${escapedLastName})
        ON CONFLICT (directory_id) DO UPDATE SET
          first_name = ${escapedFirstName},
          last_name = ${escapedLastName},
          updated_at = NOW()
      `)
    }

    // Populate core_settings with company and billing info
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".core_settings (
        company_name, logo, tagline, industry,
        address, city, state, zip, country,
        billing_plan, hipaa_compliance,
        billing_address, billing_city, billing_state, billing_zip, billing_country
      ) VALUES (
        '${companyName.replace(/'/g, "''")}',
        ${logo ? `'${logo.replace(/'/g, "''")}'` : 'NULL'},
        ${subtext ? `'${subtext.replace(/'/g, "''")}'` : 'NULL'},
        ${industry ? `'${industry.replace(/'/g, "''")}'` : 'NULL'},
        ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'},
        ${city ? `'${city.replace(/'/g, "''")}'` : 'NULL'},
        ${state ? `'${state.replace(/'/g, "''")}'` : 'NULL'},
        ${zip ? `'${zip.replace(/'/g, "''")}'` : 'NULL'},
        ${country ? `'${country.replace(/'/g, "''")}'` : 'NULL'},
        '${billingPlan || 'free'}',
        ${hipaaCompliance ? 'TRUE' : 'FALSE'},
        ${billingAddress ? `'${billingAddress.replace(/'/g, "''")}'` : 'NULL'},
        ${billingCity ? `'${billingCity.replace(/'/g, "''")}'` : 'NULL'},
        ${billingState ? `'${billingState.replace(/'/g, "''")}'` : 'NULL'},
        ${billingZip ? `'${billingZip.replace(/'/g, "''")}'` : 'NULL'},
        ${billingCountry ? `'${billingCountry.replace(/'/g, "''")}'` : 'NULL'}
      )
    `)

    // Create initial billing history entry
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".core_billing_history (
        action, new_plan, new_hipaa,
        billing_address, billing_city, billing_state, billing_zip, billing_country,
        changed_by, notes
      ) VALUES (
        'initial_signup',
        '${billingPlan || 'free'}',
        ${hipaaCompliance ? 'TRUE' : 'FALSE'},
        ${billingAddress ? `'${billingAddress.replace(/'/g, "''")}'` : 'NULL'},
        ${billingCity ? `'${billingCity.replace(/'/g, "''")}'` : 'NULL'},
        ${billingState ? `'${billingState.replace(/'/g, "''")}'` : 'NULL'},
        ${billingZip ? `'${billingZip.replace(/'/g, "''")}'` : 'NULL'},
        ${billingCountry ? `'${billingCountry.replace(/'/g, "''")}'` : 'NULL'},
        '${email.replace(/'/g, "''")}',
        'Account created'
      )
    `)

    await prisma.$disconnect()

    return NextResponse.json({
      message: 'Tenant created successfully',
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug }
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
