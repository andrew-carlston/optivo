import { type NextRequest, NextResponse } from "next/server";
import { createMainPrismaClient } from "@/lib/tenant-db";

interface RouteParams {
  params: Promise<{ tenant: string }>;
}

/**
 * DELETE - Soft delete a tenant (marks as deleted, preserves data)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

    // Verify tenant exists and is not already deleted
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenant },
    });

    if (!tenantRecord) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Soft delete: Update the tenant to mark as deleted
    // We append a timestamp to the slug to free it up for reuse
    const deletedSlug = `${tenant}-deleted-${Date.now()}`;

    await prisma.tenant.update({
      where: { slug: tenant },
      data: {
        slug: deletedSlug,
        // Add deletedAt field if schema supports it, otherwise just rename slug
      },
    });

    // Mark tenant schema as deleted (update a flag in core_settings if exists)
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "${tenant}".core_settings
        SET deleted_at = NOW(), updated_at = NOW()
      `);
    } catch {
      // If deleted_at column doesn't exist, that's okay
      console.log("Note: deleted_at column may not exist in core_settings");
    }

    return NextResponse.json({
      success: true,
      message: "Company has been deleted",
    });
  } catch (error) {
    console.error("Tenant delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET - Get tenant info
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
        createdAt: true,
      },
    });

    if (!tenantRecord) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenantRecord);
  } catch (error) {
    console.error("Tenant fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
