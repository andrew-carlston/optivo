"use server";

import { eq, and } from "drizzle-orm";
import { directory } from "@/db/schema";
import { getActionContext } from "@/features/core/lib/access";
import {
  LOCK_DURATION_MS,
  requireDirectoryAccess,
  cleanupExpiredLocks,
  type RowLock,
} from "./_lock-shared";

/**
 * Acquire a lock on a row. Returns the lock if successful.
 * If already locked by this user, refreshes the expiry.
 * If locked by another user, throws.
 */
export async function acquireRowLock(companySlug: string, rowId: string): Promise<RowLock> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "edit");

  await cleanupExpiredLocks(ctx.branchDb, ctx.company.id);

  const [existing] = await ctx.branchDb
    .select({
      id: directory.rowLocks.id,
      userId: directory.rowLocks.user_id,
      userName: directory.rowLocks.user_name,
    })
    .from(directory.rowLocks)
    .where(
      and(
        eq(directory.rowLocks.row_id, rowId),
        eq(directory.rowLocks.company_id, ctx.company.id),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.userId === ctx.user.id) {
      // Already ours — refresh expiry
      const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);
      await ctx.branchDb
        .update(directory.rowLocks)
        .set({ expires_at: expiresAt })
        .where(eq(directory.rowLocks.id, existing.id));

      return {
        id: existing.id,
        rowId,
        userId: ctx.user.id,
        userName: ctx.user.fullName,
        lockedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        overrideRequestedBy: null,
        overrideRequestedAt: null,
      };
    }
    throw new Error(`Row is locked by ${existing.userName}`);
  }

  // Fresh lock
  const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);
  const [lock] = await ctx.branchDb
    .insert(directory.rowLocks)
    .values({
      company_id: ctx.company.id,
      row_id: rowId,
      user_id: ctx.user.id,
      user_name: ctx.user.fullName,
      expires_at: expiresAt,
    })
    .returning({
      id: directory.rowLocks.id,
      lockedAt: directory.rowLocks.locked_at,
    });

  return {
    id: lock.id,
    rowId,
    userId: ctx.user.id,
    userName: ctx.user.fullName,
    lockedAt: lock.lockedAt?.toISOString() ?? new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    overrideRequestedBy: null,
    overrideRequestedAt: null,
  };
}

/**
 * Release a lock — only the lock owner can release.
 */
export async function releaseRowLock(companySlug: string, rowId: string): Promise<void> {
  const ctx = await getActionContext(companySlug);

  await ctx.branchDb
    .delete(directory.rowLocks)
    .where(
      and(
        eq(directory.rowLocks.row_id, rowId),
        eq(directory.rowLocks.user_id, ctx.user.id),
        eq(directory.rowLocks.company_id, ctx.company.id),
      ),
    );
}

/**
 * All active locks across the company (for rendering lock indicators).
 */
export async function getActiveLocks(companySlug: string): Promise<RowLock[]> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");

  await cleanupExpiredLocks(ctx.branchDb, ctx.company.id);

  const rows = await ctx.branchDb
    .select({
      id: directory.rowLocks.id,
      rowId: directory.rowLocks.row_id,
      userId: directory.rowLocks.user_id,
      userName: directory.rowLocks.user_name,
      lockedAt: directory.rowLocks.locked_at,
      expiresAt: directory.rowLocks.expires_at,
      overrideRequestedBy: directory.rowLocks.override_requested_by,
      overrideRequestedAt: directory.rowLocks.override_requested_at,
    })
    .from(directory.rowLocks)
    .where(eq(directory.rowLocks.company_id, ctx.company.id));

  return rows.map((r: any) => ({
    id: r.id,
    rowId: r.rowId,
    userId: r.userId,
    userName: r.userName,
    lockedAt: r.lockedAt?.toISOString() ?? "",
    expiresAt: r.expiresAt?.toISOString() ?? "",
    overrideRequestedBy: r.overrideRequestedBy,
    overrideRequestedAt: r.overrideRequestedAt?.toISOString() ?? null,
  }));
}

/**
 * Locks held by the current user — used to restore state after navigation.
 */
export async function getMyLocks(companySlug: string): Promise<RowLock[]> {
  const ctx = await getActionContext(companySlug);

  const rows = await ctx.branchDb
    .select({
      id: directory.rowLocks.id,
      rowId: directory.rowLocks.row_id,
      userId: directory.rowLocks.user_id,
      userName: directory.rowLocks.user_name,
      lockedAt: directory.rowLocks.locked_at,
      expiresAt: directory.rowLocks.expires_at,
      overrideRequestedBy: directory.rowLocks.override_requested_by,
      overrideRequestedAt: directory.rowLocks.override_requested_at,
    })
    .from(directory.rowLocks)
    .where(
      and(
        eq(directory.rowLocks.user_id, ctx.user.id),
        eq(directory.rowLocks.company_id, ctx.company.id),
      ),
    );

  return rows.map((r: any) => ({
    id: r.id,
    rowId: r.rowId,
    userId: r.userId,
    userName: r.userName,
    lockedAt: r.lockedAt?.toISOString() ?? "",
    expiresAt: r.expiresAt?.toISOString() ?? "",
    overrideRequestedBy: r.overrideRequestedBy,
    overrideRequestedAt: r.overrideRequestedAt?.toISOString() ?? null,
  }));
}

/**
 * Request an override on a locked row (starts 60s timer for owner to respond).
 */
export async function requestOverride(companySlug: string, rowId: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(directory.rowLocks)
    .set({
      override_requested_by: ctx.user.id,
      override_requested_at: new Date(),
    })
    .where(
      and(
        eq(directory.rowLocks.row_id, rowId),
        eq(directory.rowLocks.company_id, ctx.company.id),
      ),
    );
}

/**
 * Respond to an override request (only the lock owner can respond).
 * Approved → release lock + clear pending changes. Denied → clear request flag only.
 */
export async function respondToOverride(
  companySlug: string,
  rowId: string,
  approved: boolean,
): Promise<void> {
  const ctx = await getActionContext(companySlug);

  if (approved) {
    await ctx.branchDb
      .delete(directory.rowLocks)
      .where(
        and(
          eq(directory.rowLocks.row_id, rowId),
          eq(directory.rowLocks.user_id, ctx.user.id),
          eq(directory.rowLocks.company_id, ctx.company.id),
        ),
      );

    await ctx.branchDb
      .delete(directory.pendingChanges)
      .where(
        and(
          eq(directory.pendingChanges.row_id, rowId),
          eq(directory.pendingChanges.user_id, ctx.user.id),
          eq(directory.pendingChanges.company_id, ctx.company.id),
        ),
      );
  } else {
    await ctx.branchDb
      .update(directory.rowLocks)
      .set({
        override_requested_by: null,
        override_requested_at: null,
      })
      .where(
        and(
          eq(directory.rowLocks.row_id, rowId),
          eq(directory.rowLocks.user_id, ctx.user.id),
          eq(directory.rowLocks.company_id, ctx.company.id),
        ),
      );
  }
}
