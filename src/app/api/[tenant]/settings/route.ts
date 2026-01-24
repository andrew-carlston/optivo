import { type NextRequest, NextResponse } from "next/server";
import { createMainPrismaClient } from "@/lib/tenant-db";

interface RouteParams {
  params: Promise<{ tenant: string }>;
}

interface SettingsBody {
  name?: string;
  subtext?: string | null;
}

/**
 * PUT - Update tenant settings (company name, subtext)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient();

  try {
    const { tenant } = await params;
    const body: SettingsBody = await request.json();

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: "Invalid tenant identifier" },
        { status: 400 },
      );
    }

    // Verify tenant exists
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenant },
    });

    if (!tenantRecord) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Validate input
    if (body.name !== undefined && typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Invalid name format" },
        { status: 400 },
      );
    }

    if (body.name !== undefined && body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Company name cannot be empty" },
        { status: 400 },
      );
    }

    if (body.name !== undefined && body.name.trim().length > 100) {
      return NextResponse.json(
        { error: "Company name cannot exceed 100 characters" },
        { status: 400 },
      );
    }

    if (
      body.subtext !== undefined &&
      body.subtext !== null &&
      typeof body.subtext !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid subtext format" },
        { status: 400 },
      );
    }

    if (
      body.subtext !== undefined &&
      body.subtext !== null &&
      body.subtext.length > 200
    ) {
      return NextResponse.json(
        { error: "Tagline cannot exceed 200 characters" },
        { status: 400 },
      );
    }

    // Build update data
    const updateData: { name?: string; subtext?: string | null } = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.subtext !== undefined) {
      updateData.subtext = body.subtext?.trim() || null;
    }

    // Update tenant in main database
    const updatedTenant = await prisma.tenant.update({
      where: { slug: tenant },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        subtext: true,
      },
    });

    // Also update core_settings in tenant schema if name changed
    if (body.name !== undefined) {
      const escapedName = body.name.trim().replace(/'/g, "''");
      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_settings
        SET name = '${escapedName}', updated_at = NOW()
      `);
    }

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET - Get tenant settings
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const prisma = createMainPrismaClient();

  try {
    const { tenant } = await params;

    // Validate tenant slug format
    if (!/^[a-z0-9-]+$/.test(tenant)) {
      return NextResponse.json(
        { error: "Invalid tenant identifier" },
        { status: 400 },
      );
    }

    // Get tenant
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenant },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        subtext: true,
      },
    });

    if (!tenantRecord) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenantRecord);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
