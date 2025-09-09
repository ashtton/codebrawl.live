import type { Middleware } from "@reduxjs/toolkit";
import { wsConnect, wsDisconnect } from "./intents";
import { connectionChanged } from "../slices/connectionSlice";
import { hydrateFromServer } from "../slices/appStateSlice";
import { pushToast } from "../slices/notificationsSlice";

interface AuthData {
  token?: string;
  userId?: string;
}

type WebSocketReadyState = 0 | 1 | 2 | 3;

let socket: WebSocket | null = null;
let previousWasConnected = false;
let retries = 0;
let lastAuth: AuthData | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let manualClose = false;

export const socketMiddleware: Middleware = (store) => (next) => (action) => {
  if (wsConnect.match(action)) {
    const OPEN: WebSocketReadyState = (globalThis as any).WebSocket?.OPEN ?? 1;
    const CONNECTING: WebSocketReadyState = (globalThis as any).WebSocket?.CONNECTING ?? 0;
    const state = socket?.readyState as WebSocketReadyState | undefined;

    // Extract authentication data
    const token = action.payload?.token ?? lastAuth?.token;
    const userId = action.payload?.userId ?? lastAuth?.userId;
    lastAuth = { token, userId };

    // Handle already connected or connecting socket
    if (socket && (state === OPEN || state === CONNECTING)) {
      if (state === OPEN && (token || userId)) {
        try {
          socket.send(JSON.stringify({ type: "auth", userId, token }));
        } catch {}
      }
      store.dispatch(connectionChanged(state === OPEN ? "connected" : "connecting"));
      return next(action);
    }

    // Clear any existing timers
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
    manualClose = false;

    store.dispatch(connectionChanged("connecting"));

    // Configure WebSocket URL
    const base = (import.meta as any).env?.VITE_WS_URL || "http://localhost:8080/ws";
    const url = new URL(base);

    if (!/^wss?:/i.test(base)) {
      const preferSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      url.protocol = preferSecure ? 'wss:' : 'ws:';
    } else {
      url.protocol = url.protocol.replace("http", "ws");
    }

    if (token) url.searchParams.set("token", token);
    if (userId) url.searchParams.set("userId", userId);

    // Create WebSocket instance
    const subprotocol = (import.meta as any).env?.VITE_WS_SUBPROTOCOL as string | undefined;
    socket = subprotocol
        ? new WebSocket(url.toString(), subprotocol)
        : new WebSocket(url.toString());

    // Handle socket error
    socket.onerror = () => {
      try {
        store.dispatch(pushToast({ text: "socket error", type: "error" }));
      } catch {}
    };

    // Handle socket open
    socket.onopen = () => {
      retries = 0;
      store.dispatch(connectionChanged("connected"));

      const debug = (import.meta as any).env?.VITE_WS_DEBUG;
      if (debug) {
        try {
          store.dispatch(pushToast({ text: `connected: ${url.toString()}` }));
        } catch {}
      } else {
        store.dispatch(pushToast({ text: "connected" }));
      }

      // Send authentication after small delay
      setTimeout(() => {
        try {
          socket?.send(JSON.stringify({ type: "auth", userId, token }));
        } catch {}
      }, 10);

      // Setup keep alive pings
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
      keepAliveTimer = setInterval(() => {
        try {
          socket?.send(JSON.stringify({ type: 'ping' }));
        } catch {}
      }, 25000);

      // Setup client hello timeout
      const authOkTimeout = setTimeout(() => {
        try {
          socket?.send(JSON.stringify({ type: "client:hello" }));
        } catch {}
      }, 800);

      // Handle specific message types
      const prevOnMessage = socket.onmessage;
      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse((ev as MessageEvent).data as string);
          if (msg?.type === 'auth-ok' || msg?.type === 'ready') {
            clearTimeout(authOkTimeout);
            try {
              socket?.send(JSON.stringify({ type: 'client:hello' }));
            } catch {}
          }
          if (msg?.type === 'ping') {
            try {
              socket?.send(JSON.stringify({ type: 'pong' }));
            } catch {}
          }
        } catch {}
        prevOnMessage?.(ev as MessageEvent);
      };
    };

    // Handle socket close
    socket.onclose = (ev: CloseEvent) => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }

      const wasConnected = previousWasConnected || (store.getState() as any).connection === "connected";
      store.dispatch(connectionChanged("disconnected"));

      if (wasConnected) {
        const suffix = ev && typeof ev.code === 'number'
            ? ` (${ev.code}${ev.reason ? `: ${ev.reason}` : ''})`
            : '';
        store.dispatch(pushToast({ text: `lost connection${suffix}`, type: "error" }));
      }
      previousWasConnected = true;

      if (manualClose) return;

      // Do not reconnect if we don't have any auth info (e.g., logged out)
      if (!lastAuth?.token && !lastAuth?.userId) {
        return;
      }

      // Setup reconnection with exponential backoff
      const baseDelay = Math.min(30000, 1000 * Math.pow(2, retries++));
      const jitter = Math.floor(Math.random() * 500);
      const delay = baseDelay + jitter;

      const attempt = () => {
        // Stop attempts if auth is no longer present (e.g., user logged out during backoff)
        if (!lastAuth?.token && !lastAuth?.userId) return;
        if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
          reconnectTimer = setTimeout(attempt, 3000);
          return;
        }
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          reconnectTimer = setTimeout(attempt, 2000);
          return;
        }
        store.dispatch(wsConnect({}));
      };

      reconnectTimer = setTimeout(attempt, delay);
    };

    // Handle base messages
    const baseOnMessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        switch (msg.type) {
          case "snapshot":
          case "app:mode":
            if (msg.state) {
              store.dispatch(hydrateFromServer(msg.state));
            }
            break;
        }
      } catch {}
    };
    socket.onmessage = baseOnMessage as any;

    return next(action);
  }

  // Handle disconnect action
  if (wsDisconnect.match(action)) {
    retries = 0;
    previousWasConnected = false;
    lastAuth = null;
    manualClose = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    try {
      socket?.close();
    } catch {}

    socket = null;
    return next(action);
  }

  return next(action);
};