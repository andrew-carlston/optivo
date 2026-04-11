import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { core } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await db
    .select({
      id: core.companies.id,
      name: core.companies.name,
      slug: core.companies.slug,
      branch_id: core.companies.branch_id,
      logo_url: core.companies.logo_url,
      auth_methods: core.companies.auth_methods,
      force_sso: core.companies.force_sso,
      timezone: core.companies.timezone,
    })
    .from(core.companies)
    .where(eq(core.companies.slug, slug))
    .limit(1);

  if (!result.length) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
