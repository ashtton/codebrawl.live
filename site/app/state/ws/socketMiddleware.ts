import type {Middleware} from "@reduxjs/toolkit";
import {wsConnect, wsDisconnect, wsSend} from "./intents";
import {connectionChanged} from "../slices/connectionSlice";
import {pushToast} from "../slices/notificationsSlice";
import { trySend, decodeMessage } from "./messages";
import { createBaseOnMessage } from "./handlers";

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

        const token = action.payload?.token ?? lastAuth?.token;
        const userId = action.payload?.userId ?? lastAuth?.userId;
        lastAuth = {token, userId};

        if (socket && (state === OPEN || state === CONNECTING)) {
            if (state === OPEN && (token || userId)) {
                try {
                    trySend(socket, {type: "auth", userId, token});
                } catch {
                }
            }
            store.dispatch(connectionChanged(state === OPEN ? "connected" : "connecting"));
            return next(action);
        }

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

        const publicBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const base = (publicBase || origin) + "/ws";
        const url = new URL(base);

        if (!/^wss?:/i.test(base)) {
            const preferSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
            url.protocol = preferSecure ? 'wss:' : 'ws:';
        } else {
            url.protocol = url.protocol.replace("http", "ws");
        }

        if (token) url.searchParams.set("token", token);
        if (userId) url.searchParams.set("userId", userId);

        const subprotocol = (import.meta as any).env?.VITE_WS_SUBPROTOCOL as string | undefined;
        socket = subprotocol
            ? new WebSocket(url.toString(), subprotocol)
            : new WebSocket(url.toString());

        socket.onerror = () => {
            try {
                store.dispatch(pushToast({text: "socket error", type: "error"}));
            } catch {
            }
        };

        socket.onopen = () => {
            retries = 0;
            store.dispatch(connectionChanged("connected"));

            const debug = (import.meta as any).env?.VITE_WS_DEBUG;
            if (debug) {
                try {
                    store.dispatch(pushToast({text: `connected: ${url.toString()}`}));
                } catch {
                }
            } else {
                store.dispatch(pushToast({text: "connected"}));
            }

            setTimeout(() => {
                trySend(socket, {type: "auth", userId, token});
            }, 10);

            if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
            }
            keepAliveTimer = setInterval(() => {
                trySend(socket, {type: 'ping'});
            }, 10000);

            const authOkTimeout = setTimeout(() => {
                trySend(socket, {type: "client:hello"});
            }, 800);

            if (socket !== null) {
                const prevOnMessage = socket.onmessage;
                socket.onmessage = (ev) => {
                    const msg = decodeMessage((ev as MessageEvent).data as string);
                    if (msg && (msg.type === 'auth:ok' || msg.type === 'ready')) {
                        clearTimeout(authOkTimeout);
                        trySend(socket, { type: 'client:hello' });
                    }
                    // @ts-ignore
                    prevOnMessage?.(ev as MessageEvent);
                };
            }



        };

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
                store.dispatch(pushToast({text: `lost connection${suffix}`, type: "error"}));
            }
            previousWasConnected = true;

            if (manualClose) return;

            if (!lastAuth?.token && !lastAuth?.userId) {
                return;
            }

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

        const baseOnMessage = createBaseOnMessage(store, socket);
        socket.onmessage = baseOnMessage as any;

        return next(action);
    }

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
        } catch {
        }

        socket = null;
        return next(action);
    }

    if (wsSend.match(action)) {
        trySend(socket, action.payload.message as any);
        return next(action);
    }

    return next(action);
};