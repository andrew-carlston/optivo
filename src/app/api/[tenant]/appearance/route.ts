import { NextRequest, NextResponse } from 'next/server'
import { createMainPrismaClient } from '@/lib/tenant-db'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string }>
}

interface BadgeConfig {
  shape: 'pill' | 'square' | 'leaf' | 'corner'
  leafSide?: 'left' | 'right'
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  fill: 'raised' | 'inset' | 'outline' | 'fill' | 'solid'
  colorEnabled?: boolean
}

interface BadgeColors {
  [key: string]: { bg: string; text: string }
}

interface AppearanceSettings {
  id: string
  badge_configs: Record<string, BadgeConfig>
  badge_colors: BadgeColors
  theme_overrides: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface AppearanceRow {
  id: string
  badge_configs: Record<string, BadgeConfig> | null
  badge_colors: BadgeColors | null
  theme_overrides: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

interface AppearanceUpdateBody {
  badge_configs?: Record<string, BadgeConfig>
  badge_colors?: BadgeColors
  theme_overrides?: Record<string, unknown>
}

// ============================================================================
// Constants
// ============================================================================

const defaultAppearance = {
  badge_configs: {
    status: { shape: 'pill' as const, fill: 'solid' as const, colorEnabled: true },
    tag: { shape: 'square' as const, fill: 'fill' as const, colorEnabled: true },
    priority: { shape: 'pill' as const, fill: 'raised' as const, colorEnabled: true },
    label: { shape: 'leaf' as const, fill: 'outline' as const, leafSide: 'left' as const, colorEnabled: true }
  },
  badge_colors: {
    default: { bg: '#6b7280', text: '#ffffff' },
    primary: { bg: '#3b82f6', text: '#ffffff' },
    success: { bg: '#10b981', text: '#ffffff' },
    warning: { bg: '#f59e0b', text: '#000000' },
    danger: { bg: '#ef4444', text: '#ffffff' },
    info: { bg: '#06b6d4', text: '#ffffff' }
  },
  theme_overrides: {}
}

const validShapes = ['pill', 'square', 'leaf', 'corner']
const validFills = ['raised', 'inset', 'outline', 'fill', 'solid']
const validLeafSides = ['left', 'right']
const validCornerPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

function validateBadgeConfig(config: unknown, key: string): string | null {
  if (typeof config !== 'object' || config === null) {
    return `badge_configs.${key} must be an object`
  }

  const cfg = config as Record<string, unknown>

  // Validate shape
  if (!cfg.shape || !validShapes.includes(cfg.shape as string)) {
    return `badge_configs.${key}.shape must be one of: ${validShapes.join(', ')}`
  }

  // Validate fill
  if (!cfg.fill || !validFills.includes(cfg.fill as string)) {
    return `badge_configs.${key}.fill must be one of: ${validFills.join(', ')}`
  }

  // Validate leafSide if shape is leaf
  if (cfg.shape === 'leaf' && cfg.leafSide !== undefined) {
    if (!validLeafSides.includes(cfg.leafSide as string)) {
      return `badge_configs.${key}.leafSide must be one of: ${validLeafSides.join(', ')}`
    }
  }

  // Validate cornerPosition if shape is corner
  if (cfg.shape === 'corner' && cfg.cornerPosition !== undefined) {
    if (!validCornerPositions.includes(cfg.cornerPosition as string)) {
      return `badge_configs.${key}.cornerPosition must be one of: ${validCornerPositions.join(', ')}`
    }
  }

  // Validate colorEnabled if provided
  if (cfg.colorEnabled !== undefined && typeof cfg.colorEnabled !== 'boolean') {
    return `badge_configs.${key}.colorEnabled must be a boolean`
  }

  return null
}

function validateBadgeColors(colors: unknown): string | null {
  if (typeof colors !== 'object' || colors === null) {
    return 'badge_colors must be an object'
  }

  const colorMap = colors as Record<string, unknown>

  for (const [key, value] of Object.entries(colorMap)) {
    if (typeof value !== 'object' || value === null) {
      return `badge_colors.${key} must be an object with bg and text properties`
    }

    const colorPair = value as Record<string, unknown>

    if (typeof colorPair.bg !== 'string' || !isValidHexColor(colorPair.bg)) {
      return `badge_colors.${key}.bg must be a valid hex color (e.g., #ffffff)`
    }

    if (typeof colorPair.text !== 'string' || !isValidHexColor(colorPair.text)) {
      return `badge_colors.${key}.text must be a valid hex color (e.g., #000000)`
    }
  }

  return null
}

// ============================================================================
// Helper - Ensure core_appearance table exists
// ============================================================================

async function ensureAppearanceTable(prisma: ReturnType<typeof createMainPrismaClient>, tenant: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tenant}".core_appearance (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        badge_configs JSONB DEFAULT '${JSON.stringify(defaultAppearance.badge_configs).replace(/'/g, "''")}'::jsonb,
        badge_colors JSONB DEFAULT '${JSON.stringify(defaultAppearance.badge_colors).replace(/'/g, "''")}'::jsonb,
        theme_overrides JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
  } catch (error) {
    // Table might already exist or schema creation might fail - log but don't throw
    console.log('Note: Could not create core_appearance table (may already exist):', error)
  }
}

// ============================================================================
// GET - Fetch tenant appearance settings
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params

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

    // Ensure the table exists (auto-migration)
    await ensureAppearanceTable(prisma, tenant)

    // Query core_appearance table using raw SQL
    let appearanceRecords: AppearanceRow[] = []
    try {
      appearanceRecords = await prisma.$queryRawUnsafe<AppearanceRow[]>(`
        SELECT id, badge_configs, badge_colors, theme_overrides, created_at, updated_at
        FROM "${tenant}".core_appearance
        LIMIT 1
      `)
    } catch (queryError) {
      // If the table still doesn't exist (e.g., schema doesn't exist), return defaults
      console.log('Could not query core_appearance table, returning defaults:', queryError)
      return NextResponse.json({
        data: {
          id: null,
          badge_configs: defaultAppearance.badge_configs,
          badge_colors: defaultAppearance.badge_colors,
          theme_overrides: defaultAppearance.theme_overrides,
          created_at: null,
          updated_at: null
        }
      })
    }

    // If no record exists, return defaults
    if (appearanceRecords.length === 0) {
      return NextResponse.json({
        data: {
          id: null,
          badge_configs: defaultAppearance.badge_configs,
          badge_colors: defaultAppearance.badge_colors,
          theme_overrides: defaultAppearance.theme_overrides,
          created_at: null,
          updated_at: null
        }
      })
    }

    const record = appearanceRecords[0]

    // Return appearance settings with defaults merged for any missing values
    const responseData: AppearanceSettings = {
      id: record.id,
      badge_configs: record.badge_configs || defaultAppearance.badge_configs,
      badge_colors: record.badge_colors || defaultAppearance.badge_colors,
      theme_overrides: record.theme_overrides || defaultAppearance.theme_overrides,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString()
    }

    return NextResponse.json({ data: responseData })
  } catch (error) {
    console.error('appearance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appearance settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// PUT - Update tenant appearance settings (upsert)
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient()

  try {
    const { tenant } = await params
    const body: AppearanceUpdateBody = await request.json()

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

    // Validate badge_configs if provided
    if (body.badge_configs !== undefined) {
      if (typeof body.badge_configs !== 'object' || body.badge_configs === null) {
        return NextResponse.json(
          { error: 'badge_configs must be an object' },
          { status: 400 }
        )
      }

      for (const [key, config] of Object.entries(body.badge_configs)) {
        const configError = validateBadgeConfig(config, key)
        if (configError) {
          return NextResponse.json(
            { error: configError },
            { status: 400 }
          )
        }
      }
    }

    // Validate badge_colors if provided
    if (body.badge_colors !== undefined) {
      const colorsError = validateBadgeColors(body.badge_colors)
      if (colorsError) {
        return NextResponse.json(
          { error: colorsError },
          { status: 400 }
        )
      }
    }

    // Validate theme_overrides if provided
    if (body.theme_overrides !== undefined) {
      if (typeof body.theme_overrides !== 'object' || body.theme_overrides === null) {
        return NextResponse.json(
          { error: 'theme_overrides must be an object' },
          { status: 400 }
        )
      }
    }

    // Ensure the table exists (auto-migration)
    await ensureAppearanceTable(prisma, tenant)

    // Check if appearance record already exists
    let existingRecords: { id: string }[] = []
    try {
      existingRecords = await prisma.$queryRawUnsafe<{ id: string }[]>(`
        SELECT id FROM "${tenant}".core_appearance LIMIT 1
      `)
    } catch (queryError) {
      console.log('Could not query core_appearance table:', queryError)
      return NextResponse.json(
        { error: 'Appearance table does not exist and could not be created' },
        { status: 500 }
      )
    }

    // Prepare JSON values for SQL - escape single quotes in stringified JSON
    const badgeConfigsJson = body.badge_configs
      ? JSON.stringify(body.badge_configs).replace(/'/g, "''")
      : null
    const badgeColorsJson = body.badge_colors
      ? JSON.stringify(body.badge_colors).replace(/'/g, "''")
      : null
    const themeOverridesJson = body.theme_overrides
      ? JSON.stringify(body.theme_overrides).replace(/'/g, "''")
      : null

    if (existingRecords.length > 0) {
      // Update existing record
      const updateClauses: string[] = []

      if (badgeConfigsJson !== null) {
        updateClauses.push(`badge_configs = '${badgeConfigsJson}'::jsonb`)
      }
      if (badgeColorsJson !== null) {
        updateClauses.push(`badge_colors = '${badgeColorsJson}'::jsonb`)
      }
      if (themeOverridesJson !== null) {
        updateClauses.push(`theme_overrides = '${themeOverridesJson}'::jsonb`)
      }

      if (updateClauses.length > 0) {
        updateClauses.push('updated_at = NOW()')

        await prisma.$executeRawUnsafe(`
          UPDATE "${tenant}".core_appearance
          SET ${updateClauses.join(', ')}
          WHERE id = '${existingRecords[0].id}'
        `)
      }
    } else {
      // Insert new record with provided values or defaults
      const insertBadgeConfigs = badgeConfigsJson
        ? `'${badgeConfigsJson}'::jsonb`
        : `'${JSON.stringify(defaultAppearance.badge_configs).replace(/'/g, "''")}'::jsonb`
      const insertBadgeColors = badgeColorsJson
        ? `'${badgeColorsJson}'::jsonb`
        : `'${JSON.stringify(defaultAppearance.badge_colors).replace(/'/g, "''")}'::jsonb`
      const insertThemeOverrides = themeOverridesJson
        ? `'${themeOverridesJson}'::jsonb`
        : `'${JSON.stringify(defaultAppearance.theme_overrides).replace(/'/g, "''")}'::jsonb`

      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenant}".core_appearance (
          id, badge_configs, badge_colors, theme_overrides, created_at, updated_at
        ) VALUES (
          gen_random_uuid()::text,
          ${insertBadgeConfigs},
          ${insertBadgeColors},
          ${insertThemeOverrides},
          NOW(),
          NOW()
        )
      `)
    }

    // Fetch and return the updated record
    const updatedRecords = await prisma.$queryRawUnsafe<AppearanceRow[]>(`
      SELECT id, badge_configs, badge_colors, theme_overrides, created_at, updated_at
      FROM "${tenant}".core_appearance
      LIMIT 1
    `)

    if (updatedRecords.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated appearance settings' },
        { status: 500 }
      )
    }

    const record = updatedRecords[0]

    const responseData: AppearanceSettings = {
      id: record.id,
      badge_configs: record.badge_configs || defaultAppearance.badge_configs,
      badge_colors: record.badge_colors || defaultAppearance.badge_colors,
      theme_overrides: record.theme_overrides || defaultAppearance.theme_overrides,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString()
    }

    return NextResponse.json({
      message: 'Appearance settings updated successfully',
      data: responseData
    })
  } catch (error) {
    console.error('appearance PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update appearance settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
