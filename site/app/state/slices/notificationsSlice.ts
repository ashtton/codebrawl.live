import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export type Toast = { id: string; text: string; type?: "info" | "error"; ts: number };

const slice = createSlice({
    name: "notifications",
    initialState: [] as Toast[],
    reducers: {
        pushToast(state, action: PayloadAction<Omit<Toast, "id" | "ts"> & { id?: string; ts?: number }>) {
            const id = action.payload.id ?? Math.random().toString(36).slice(2);
            const ts = action.payload.ts ?? Date.now();
            const idx = state.findIndex(t => t.id === id);
            if (idx >= 0) {
                state[idx] = { id, ts, text: action.payload.text, type: action.payload.type };
            } else {
                state.push({ id, ts, text: action.payload.text, type: action.payload.type });
            }
        },
        removeToast(state, action: PayloadAction<string>) {
            return state.filter(t => t.id !== action.payload);
        }
    }
});

export const {pushToast, removeToast} = slice.actions;
export default slice.reducer;
