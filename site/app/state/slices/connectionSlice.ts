import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit"

export type ConnectionState = "disconnected" | "connecting" | "connected";

const slice = createSlice({
    name: "connection",
    initialState: "disconnected" as ConnectionState,
    reducers: {
        connectionChanged: (_state, action: PayloadAction<ConnectionState>) => action.payload,
    },
});

export const {connectionChanged} = slice.actions;
export default slice.reducer;
