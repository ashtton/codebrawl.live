import React from "react";
import {Header} from "~/components/lobby/Header";
import {Tabs, type TabKey} from "~/components/lobby/Tabs";
import {QueueSection} from "~/components/lobby/QueueSection";
import {RoomsSection} from "~/components/lobby/RoomsSection";
import {TopPlayers} from "~/components/lobby/TopPlayers";
import {useAppDispatch} from "~/state/store";
import {pushToast} from "~/state/slices/notificationsSlice";
import {useUser} from "@clerk/react-router";
import {splashes} from "~/lib/splashes";

export function LobbyPage() {
    const [tab, setTab] = React.useState<TabKey>("home");
    const dispatch = useAppDispatch();
    const {user} = useUser();
    const username = user?.firstName ?? user?.username ?? "Coder";

    const [splash, setSplash] = React.useState<string>("");

    React.useEffect(() => {
        if (typeof document === "undefined") return;
        // Read from cookie; if absent or expired, pick new and set for 5 minutes
        import("~/lib/cookie").then(({ getCookie, setCookie }) => {
            const existing = getCookie("cb_splash");
            if (existing && existing.length > 0) {
                setSplash(existing.replace("%username", username));
                return;
            }
            const next = splashes[Math.floor(Math.random() * splashes.length)];
            setCookie("cb_splash", next, 5 * 60);
            setSplash(next.replace("%username", username));
        }).catch(() => {
            const next = splashes[Math.floor(Math.random() * splashes.length)];
            setSplash(next.replace("%username", username));
        });
    }, [username]);

    function handleJoinUnranked() {
        dispatch(pushToast({text: "Joining unranked queue...", type: "info"}));
    }

    function handleCreatePrivate() {
        dispatch(pushToast({text: "Creating private room...", type: "info"}));
    }

    function handleJoinRoom(roomId: string) {
        dispatch(pushToast({text: `Joining room ${roomId}...`, type: "info"}));
    }

    function handleJoinPrivate() {
        let code: string | null = null;
        if (typeof window !== "undefined") {
            code = window.prompt("Enter room code or URL:")?.trim() || null;
        }
        if (!code) return;
        dispatch(pushToast({ text: `Joining private room ${code}...`, type: "info" }));
    }

    return (
        <main className="relative min-h-dvh overflow-hidden bg-black text-white">
            <section className="relative z-10 flex min-h-dvh flex-col">
                <Header/>

                <div className="mx-auto flex w-full max-w-9/12 flex-1 flex-col items-center px-6 pb-16 pt-8">
                    <div className="flex w-full items-center justify-between">
                        <div className="grid">
                            <h1 className="text-2xl font-bold">Welcome back!</h1>
                            <span className="text-gray-200 tracking-wide">{splash}</span>
                        </div>
                        <Tabs value={tab} onChange={setTab}/>
                    </div>

                    <div className="mt-8 w-full">
                        {tab === "home" && (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                <div className="lg:col-span-2">
                                    <QueueSection onJoinUnranked={handleJoinUnranked} onCreateRoom={handleCreatePrivate} onJoinPrivate={handleJoinPrivate}/>
                                </div>
                                <div className="lg:col-span-1">
                                    <TopPlayers />
                                </div>
                            </div>
                        )}

                        {tab === "stats" && (
                            <div
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/80 ring-1 ring-white/10 backdrop-blur">
                                <h2 className="text-xl font-semibold">Your Stats</h2>
                                <p className="mt-2 text-white/60">Wins, losses, and streaks will appear here.</p>
                            </div>
                        )}

                        {tab === "friends" && (
                            <div
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/80 ring-1 ring-white/10 backdrop-blur">
                                <h2 className="text-xl font-semibold">Friends</h2>
                                <p className="mt-2 text-white/60">Add or challenge friends to private matches.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}

export default LobbyPage;
