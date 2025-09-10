import {useEffect} from "react";
import {useAuth, useUser} from "@clerk/react-router";
import {useAppDispatch} from "~/state/store";
import {wsConnect, wsDisconnect} from "~/state/ws/intents";

export function AutoConnect() {
    const dispatch = useAppDispatch();
    const {getToken, isSignedIn} = useAuth();
    const {user} = useUser();
    useEffect(() => {
        let cancelled = false;

        async function go() {
            try {
                if (!isSignedIn) {
                    // Ensure we disconnect and stop reconnecting when signed out
                    dispatch(wsDisconnect());
                    return;
                }
                const token = await getToken();
                if (cancelled) return;
                dispatch(wsConnect({token: token ?? undefined, userId: user?.id}));
            } catch (e) {
                if (!cancelled) dispatch(wsConnect({userId: user?.id}));
            }
        }

        go();
        return () => {
            cancelled = true;
        };
    }, [dispatch, getToken, isSignedIn, user?.id]);
    return null;
}
