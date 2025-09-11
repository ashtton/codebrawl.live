import type { AppStateData } from "../slices/appStateSlice";
import type { Room } from "../slices/roomSlice";

export type ServerMessage =
  | { type: "auth:ok"; userId?: string; issuer?: string; exp?: number }
  | { type: "ready" }
  | { type: "ping" }
  | { type: "snapshot"; state: AppStateData }
  | { type: "app:mode"; state: AppStateData }
  | { type: "room:state"; room: Room | { state: "lobby" }; users?: { userId: string; username?: string; imageUrl?: string }[] }
  | { type: "room:chat"; code: string; from: string; message: string; ts: number; username?: string; imageUrl?: string }
    | { type: "room:created"; room: Room }
  | { type: string; [key: string]: unknown };

export type ClientMessage =
  | { type: "auth"; token?: string; userId?: string }
  | { type: "client:hello" }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "room:create"; roomType: "ranked" | "casual" | "private"; maxUsers?: number }
  | { type: "room:join"; code: string }
  | { type: "room:leave"; code: string }
  | { type: "room:state"; code?: string }
  | { type: "room:start"; code: string; gameState: unknown }
  | { type: "room:chat"; code: string; message: string };

export function safeJsonParse(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export function decodeMessage(input: unknown): ServerMessage | null {
  const data = safeJsonParse(input);
  if (!data || typeof data !== "object") return null;
  const anyData = data as any;
  const type = anyData.type;
  if (typeof type !== "string") return null;

  switch (type) {
    case "auth-ok":
    case "ready":
    case "ping":
      return { type } as ServerMessage;
    case "snapshot":
    case "app:mode": {
      const state = anyData.state;
      if (!state || typeof state !== "object") return { type } as ServerMessage;
      return { type, state } as ServerMessage;
    }
    default:
      return anyData as ServerMessage;
  }
}

export function encodeMessage(msg: ClientMessage | ServerMessage): string {
  return JSON.stringify(msg);
}

export function trySend(ws: WebSocket | null | undefined, msg: ClientMessage | ServerMessage): void {
  if (!ws || ws.readyState !== (globalThis as any).WebSocket?.OPEN && ws.readyState !== 1) return;
  try {
    ws.send(encodeMessage(msg));
  } catch {
    // ignore
  }
}
