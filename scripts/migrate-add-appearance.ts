/**
 * Migration script to add core_appearance table to existing tenant schemas
 * Run with: npx tsx scripts/migrate-add-appearance.ts
 * Run with specific schema: npx tsx scripts/migrate-add-appearance.ts lawnstarter
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

interface SchemaRow {
  schema_name: string
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
  const prisma = new PrismaClient({ adapter })

  // Check for command line argument specifying a schema
  const specifiedSchema = process.argv[2]

  try {
    let schemas: SchemaRow[] = []

    if (specifiedSchema) {
      // Use the specified schema
      console.log(`Targeting specified schema: ${specifiedSchema}`)
      schemas = [{ schema_name: specifiedSchema }]
    } else {
      // First, let's see all non-system schemas
      const allSchemas = await prisma.$queryRaw<SchemaRow[]>(
        Prisma.sql`
          SELECT schema_name
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
        `
      )
      console.log('All schemas in database:', allSchemas.map(s => s.schema_name))

      // Get all non-system schemas that aren't 'public'
      schemas = allSchemas.filter(s => s.schema_name !== 'public')
    }

    console.log(`\nFound ${schemas.length} tenant schemas to migrate`)

    for (const schema of schemas) {
      console.log(`\nMigrating schema: ${schema.schema_name}`)

      try {
        // Add core_appearance table to tenant schema
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "${schema.schema_name}".core_appearance (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

            -- Badge configurations stored as JSONB
            badge_configs JSONB DEFAULT '{
              "status": {
                "shape": "pill",
                "fill": "solid",
                "size": "sm"
              },
              "tag": {
                "shape": "square",
                "fill": "soft",
                "size": "sm"
              }
            }',

            -- Default colors for badge types
            badge_colors JSONB DEFAULT '{
              "default": { "bg": "#6b7280", "text": "#ffffff" },
              "primary": { "bg": "#3b82f6", "text": "#ffffff" },
              "success": { "bg": "#10b981", "text": "#ffffff" },
              "warning": { "bg": "#f59e0b", "text": "#000000" },
              "danger": { "bg": "#ef4444", "text": "#ffffff" },
              "info": { "bg": "#06b6d4", "text": "#ffffff" }
            }',

            -- Future: theme overrides, custom CSS variables, etc.
            theme_overrides JSONB DEFAULT '{}',

            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `)

        console.log(`  ✓ Created core_appearance table for ${schema.schema_name}`)
      } catch (error) {
        console.error(`  ✗ Error migrating ${schema.schema_name}:`, error)
      }
    }

    console.log('\nMigration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
