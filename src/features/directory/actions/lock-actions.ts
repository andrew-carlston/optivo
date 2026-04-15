// Barrel re-export for lock + pending-change actions.
// Split into focused files:
//   _lock-shared.ts     types, constants, cleanup helper, access helper
//   locks.ts            lock acquire/release/query + override flow
//   pending-changes.ts  draft backup CRUD

export type { RowLock, PendingChange } from "./_lock-shared";

export {
  acquireRowLock,
  releaseRowLock,
  getActiveLocks,
  getMyLocks,
  requestOverride,
  respondToOverride,
} from "./locks";

export {
  savePendingChange,
  getMyPendingChanges,
  clearPendingChanges,
} from "./pending-changes";
