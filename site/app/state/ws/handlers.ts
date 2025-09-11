import {decodeMessage, trySend, type ServerMessage} from "./messages";
import {hydrateFromServer} from "../slices/appStateSlice";
import {chatReceived, roomStateReceived} from "../slices/roomSlice";

export function createBaseOnMessage(store: any, socket: WebSocket | null) {
    return (ev: MessageEvent) => {
        const msg = decodeMessage((ev as MessageEvent).data);
        if (!msg) return;
        handleServerMessage(store, socket, msg);
    };
}

export function handleServerMessage(store: any, socket: WebSocket | null, msg: ServerMessage) {
    console.log("handleServerMessage", msg);
    switch (msg.type) {
        case "auth:ok":
            break;
        case "snapshot":
        case "app:mode":
            if ((msg as any).state) {
                store.dispatch(hydrateFromServer((msg as any).state));
            }
            break;
        case "room:created": {
            const {room} = msg as any;
            store.dispatch(roomStateReceived({room}));
            break;
        }
        case "room:state": {
            const {room} = msg as any;
            const users = (msg as any).users as { userId: string; username?: string; imageUrl?: string }[] | undefined;
            store.dispatch(roomStateReceived({room, users}));
            break;
        }
        case "room:chat": {
            store.dispatch(chatReceived(msg as any));
            break;
        }
        default:
            break;
    }
}
