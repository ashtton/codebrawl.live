import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type {TypedUseSelectorHook} from "react-redux";
import connectionReducer from "./slices/connectionSlice";
import appStateReducer from "./slices/appStateSlice";
import notificationsReducer from "./slices/notificationsSlice";
import { socketMiddleware } from "./ws/socketMiddleware";

export const store = configureStore({
  reducer: {
    connection: connectionReducer,
    appState: appStateReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefault) => getDefault().concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;