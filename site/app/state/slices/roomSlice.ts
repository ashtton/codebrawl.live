import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type RoomType = "ranked" | "casual" | "private";
export type RoomState = "lobby" | "in-game" | "ended";

export type Room = {
  code: string;
  type: RoomType;
  state: RoomState;
  maxUsers: number;
  gameState?: unknown;
  updatedAt: number;
};

export type RoomUser = {
  userId: string;
  username?: string;
  imageUrl?: string;
};

export type RoomPresence = {
  room: Room | null;
  users: RoomUser[];
};

export type ChatMessage = {
  type: "room:chat";
  code: string;
  from: string;
  message: string;
  ts: number;
  username?: string;
  imageUrl?: string;
};

export interface RoomSliceState {
  presence: RoomPresence;
  chat: ChatMessage[];
}

const initialState: RoomSliceState = {
  presence: { room: null, users: [] },
  chat: [],
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    roomStateReceived(state, action: PayloadAction<{ room: Room | { state: "lobby" } ; users?: RoomUser[] }>) {
      const { room, users } = action.payload as any;
      const isRealRoom = room && typeof room === "object" && "code" in room;
      if (!isRealRoom) {
        state.presence = { room: null, users: [] };
        return;
      }
      state.presence = {
        room: room as Room,
        users: Array.isArray(users) ? users : state.presence.users,
      };
    },
    roomUsersUpdated(state, action: PayloadAction<RoomUser[]>) {
      state.presence.users = action.payload;
    },
    roomLeft(state) {
      state.presence = { room: null, users: [] };
    },
    chatReceived(state, action: PayloadAction<ChatMessage>) {
      state.chat.push(action.payload);
      if (state.chat.length > 200) state.chat.shift();
    },
    resetRoom(state) {
      state.presence = { room: null, users: [] };
      state.chat = [];
    },
  },
});

export const { roomStateReceived, roomUsersUpdated, roomLeft, chatReceived, resetRoom } = roomSlice.actions;
export default roomSlice.reducer;
export type { RoomSliceState };
