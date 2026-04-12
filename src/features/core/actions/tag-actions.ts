"use server";

import { eq, and, sql, or } from "drizzle-orm";
import { db } from "@/db/client";
import { core } from "@/db/schema";

// ── Types ──

export type TagRow = {
  id: string;
  name: string;
  color: string;
  type: "tag" | "group";
  isGlobal: boolean;
  companyId: string | null;
  assignmentCount: number;
};

export type TagAssignment = {
  id: string;
  tagId: string;
  tagName: string;
  tagColor: string;
  tagType: string;
};

// ── Tag CRUD ──

/** Get all tags for a context (platform or company). Companies also see global platform tags. */
export async function getTags(companyId: string | null): Promise<TagRow[]> {
  let condition;
  if (companyId) {
    // Company tags + global platform tags
    condition = or(
      eq(core.tags.company_id, companyId),
      and(sql`${core.tags.company_id} IS NULL`, eq(core.tags.is_global, true)),
    );
  } else {
    // Platform tags only
    condition = sql`${core.tags.company_id} IS NULL`;
  }

  const rows = await db
    .select({
      id: core.tags.id,
      name: core.tags.name,
      color: core.tags.color,
      type: core.tags.type,
      isGlobal: core.tags.is_global,
      companyId: core.tags.company_id,
    })
    .from(core.tags)
    .where(condition)
    .orderBy(core.tags.type, core.tags.name);

  // Get assignment counts
  const counts = await db
    .select({
      tagId: core.tagAssignments.tag_id,
      count: sql<number>`count(*)`,
    })
    .from(core.tagAssignments)
    .groupBy(core.tagAssignments.tag_id);
  const countMap = new Map(counts.map((r) => [r.tagId, Number(r.count)]));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color ?? "#6366f1",
    type: (r.type as "tag" | "group") ?? "tag",
    isGlobal: r.isGlobal ?? false,
    companyId: r.companyId,
    assignmentCount: countMap.get(r.id) ?? 0,
  }));
}

/** Create a new tag or group. */
export async function createTag(data: {
  companyId: string | null;
  name: string;
  color?: string;
  type?: "tag" | "group";
  isGlobal?: boolean;
}): Promise<string> {
  const inserted = await db
    .insert(core.tags)
    .values({
      company_id: data.companyId,
      name: data.name,
      color: data.color ?? "#6366f1",
      type: data.type ?? "tag",
      is_global: data.isGlobal ?? false,
    })
    .returning({ id: core.tags.id });
  return inserted[0].id;
}

/** Update a tag. */
export async function updateTag(
  tagId: string,
  data: { name?: string; color?: string; isGlobal?: boolean },
): Promise<void> {
  await db
    .update(core.tags)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.isGlobal !== undefined && { is_global: data.isGlobal }),
    })
    .where(eq(core.tags.id, tagId));
}

/** Delete a tag (cascades to assignments). */
export async function deleteTag(tagId: string): Promise<void> {
  await db.delete(core.tags).where(eq(core.tags.id, tagId));
}

// ── Assignments ──

/** Get tags assigned to an entity. */
export async function getEntityTags(
  entityType: string,
  entityId: string,
): Promise<TagAssignment[]> {
  const rows = await db
    .select({
      id: core.tagAssignments.id,
      tagId: core.tagAssignments.tag_id,
      tagName: core.tags.name,
      tagColor: core.tags.color,
      tagType: core.tags.type,
    })
    .from(core.tagAssignments)
    .innerJoin(core.tags, eq(core.tagAssignments.tag_id, core.tags.id))
    .where(
      and(
        eq(core.tagAssignments.entity_type, entityType),
        eq(core.tagAssignments.entity_id, entityId),
      ),
    )
    .orderBy(core.tags.name);

  return rows.map((r) => ({
    id: r.id,
    tagId: r.tagId,
    tagName: r.tagName,
    tagColor: r.tagColor ?? "#6366f1",
    tagType: r.tagType ?? "tag",
  }));
}

/** Assign a tag to an entity. */
export async function assignTag(
  tagId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  await db
    .insert(core.tagAssignments)
    .values({ tag_id: tagId, entity_type: entityType, entity_id: entityId })
    .onConflictDoNothing();
}

/** Remove a tag from an entity. */
export async function unassignTag(assignmentId: string): Promise<void> {
  await db.delete(core.tagAssignments).where(eq(core.tagAssignments.id, assignmentId));
}

// ── Template ↔ Company Assignments ──

/** Get company IDs assigned to a template. */
export async function getTemplateCompanies(templateId: string): Promise<string[]> {
  const rows = await db
    .select({ companyId: core.templateCompanies.company_id })
    .from(core.templateCompanies)
    .where(eq(core.templateCompanies.template_id, templateId));
  return rows.map((r) => r.companyId);
}

/** Set companies assigned to a template (replace all). */
export async function setTemplateCompanies(templateId: string, companyIds: string[]): Promise<void> {
  await db
    .delete(core.templateCompanies)
    .where(eq(core.templateCompanies.template_id, templateId));
  if (companyIds.length > 0) {
    await db.insert(core.templateCompanies).values(
      companyIds.map((cid) => ({ template_id: templateId, company_id: cid })),
    );
  }
}

/** Bulk set tags on an entity (replace all). */
export async function setEntityTags(
  entityType: string,
  entityId: string,
  tagIds: string[],
): Promise<void> {
  // Remove all existing
  await db
    .delete(core.tagAssignments)
    .where(
      and(
        eq(core.tagAssignments.entity_type, entityType),
        eq(core.tagAssignments.entity_id, entityId),
      ),
    );
  // Add new
  if (tagIds.length > 0) {
    await db.insert(core.tagAssignments).values(
      tagIds.map((tagId) => ({
        tag_id: tagId,
        entity_type: entityType,
        entity_id: entityId,
      })),
    );
  }
}
