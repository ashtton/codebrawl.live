import { createSlice } from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export type AppMode = "lobby" | "inGame" | "spectating";
export interface AppStateData {
  mode: AppMode;
  lobby?: { /* placeholder for lobby info */ };
  inGame?: { matchId?: string };
  spectating?: { matchId?: string };
}

const initialState: AppStateData = { mode: "lobby" };

const appStateSlice = createSlice({
  name: "appState",
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<AppMode>) {
      state.mode = action.payload;
    },
    hydrateFromServer(_state, action: PayloadAction<AppStateData>) {
      return action.payload;
    },
  },
});

export const { setMode, hydrateFromServer } = appStateSlice.actions;
export default appStateSlice.reducer;
