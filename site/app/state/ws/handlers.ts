import { decodeMessage, trySend, type ServerMessage } from "./messages";
import { hydrateFromServer } from "../slices/appStateSlice";

export function createBaseOnMessage(store: any, socket: WebSocket | null) {
  return (ev: MessageEvent) => {
    const msg = decodeMessage((ev as MessageEvent).data);
    if (!msg) return;
    handleServerMessage(store, socket, msg);
  };
}

export function handleServerMessage(store: any, socket: WebSocket | null, msg: ServerMessage) {
  console.log(msg)
  switch (msg.type) {
    case "auth:ok":
      break;
    case "snapshot":
    case "app:mode":
      if ((msg as any).state) {
        store.dispatch(hydrateFromServer((msg as any).state));
      }
      break;
    default:
      break;
  }
}
