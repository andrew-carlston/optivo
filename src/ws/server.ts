import { WebSocketServer, WebSocket } from "ws";
import type { WsMessage, LockAcquiredPayload, LockReleasedPayload, OverrideRequestedPayload, OverrideResponsePayload, AutoUnlockedPayload, ChangesAppliedPayload } from "./types";

const PORT = parseInt(process.env.WS_PORT ?? "3001", 10);

// ── Room Management ──

type Client = {
  ws: WebSocket;
  userId: string;
  companyId: string;
};

const rooms = new Map<string, Set<Client>>();

function getRoomKey(companyId: string): string {
  return `company:${companyId}:directory`;
}

function joinRoom(client: Client): void {
  const key = getRoomKey(client.companyId);
  if (!rooms.has(key)) rooms.set(key, new Set());
  rooms.get(key)!.add(client);
}

function leaveRoom(client: Client): void {
  const key = getRoomKey(client.companyId);
  rooms.get(key)?.delete(client);
  if (rooms.get(key)?.size === 0) rooms.delete(key);
}

function broadcast(companyId: string, message: WsMessage, excludeUserId?: string): void {
  const key = getRoomKey(companyId);
  const room = rooms.get(key);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

function sendToUser(companyId: string, userId: string, message: WsMessage): void {
  const key = getRoomKey(companyId);
  const room = rooms.get(key);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

// ── WebSocket Server ──

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  let client: Client | null = null;

  ws.on("message", (raw) => {
    try {
      const msg: WsMessage = JSON.parse(raw.toString());

      switch (msg.type) {
        case "join": {
          client = { ws, userId: msg.payload.userId, companyId: msg.payload.companyId };
          joinRoom(client);
          break;
        }

        case "lock_acquired": {
          broadcast(msg.companyId, msg);
          break;
        }

        case "lock_released": {
          broadcast(msg.companyId, msg);
          break;
        }

        case "override_requested": {
          // Send to the lock owner only
          const payload = msg.payload as OverrideRequestedPayload;
          // Broadcast to all so everyone sees the override request state
          broadcast(msg.companyId, msg);
          break;
        }

        case "override_response": {
          broadcast(msg.companyId, msg);
          break;
        }

        case "auto_unlocked": {
          broadcast(msg.companyId, msg);
          break;
        }

        case "changes_applied": {
          broadcast(msg.companyId, msg);
          break;
        }
      }
    } catch (err) {
      // Ignore malformed messages
    }
  });

  ws.on("close", () => {
    if (client) leaveRoom(client);
  });

  ws.on("error", () => {
    if (client) leaveRoom(client);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// ── Lock Cleanup Sweep (every 30s) ──
// In production, this would query the DB for expired locks.
// For now, the server just relays messages — cleanup happens via server actions.
