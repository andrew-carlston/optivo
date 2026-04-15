// ── WebSocket Message Types ──

export type WsMessageType =
  | "join"
  | "leave"
  | "lock_acquired"
  | "lock_released"
  | "override_requested"
  | "override_response"
  | "auto_unlocked"
  | "changes_applied";

export type WsMessage = {
  type: WsMessageType;
  companyId: string;
  payload: any;
};

// ── Payload Types ──

export type LockAcquiredPayload = {
  rowId: string;
  userId: string;
  userName: string;
  expiresAt: string;
};

export type LockReleasedPayload = {
  rowId: string;
};

export type OverrideRequestedPayload = {
  rowId: string;
  requestingUserId: string;
  requestingUserName: string;
};

export type OverrideResponsePayload = {
  rowId: string;
  approved: boolean;
};

export type AutoUnlockedPayload = {
  rowId: string;
  reason: "timeout" | "override_timeout";
};

export type ChangesAppliedPayload = {
  rowIds: string[];
  userId: string;
};

// ── Client → Server ──

export type JoinPayload = {
  companyId: string;
  userId: string;
};
