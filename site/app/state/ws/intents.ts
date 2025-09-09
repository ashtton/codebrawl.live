import { createAction } from "@reduxjs/toolkit";

export const wsConnect = createAction<{ token?: string; userId?: string }>("ws/connect");
export const wsDisconnect = createAction("ws/disconnect");
