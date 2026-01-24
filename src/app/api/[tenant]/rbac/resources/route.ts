import { NextRequest, NextResponse } from 'next/server'
import { getRegistry, registerDefaultResources } from '@/lib/rbac-registry'

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ tenant: string }>
}

// ============================================================================
// GET - Fetch registered RBAC resources (pages, tables)
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { tenant } = await params

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: 'Invalid tenant identifier' },
        { status: 400 }
      )
    }

    // Ensure defaults are registered (in case module wasn't loaded)
    registerDefaultResources()

    // Get the current registry
    const registry = getRegistry()

    return NextResponse.json({
      success: true,
      data: {
        pages: registry.pages,
        tables: registry.tables
      }
    })
  } catch (error) {
    console.error('rbac resources GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RBAC resources' },
      { status: 500 }
    )
  }
}
