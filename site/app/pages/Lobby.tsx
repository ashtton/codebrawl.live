import React from "react";
import {Header} from "~/components/lobby/Header";
import {Tabs, type TabKey} from "~/components/lobby/Tabs";
import {QueueSection} from "~/components/lobby/QueueSection";
import {RoomsSection} from "~/components/lobby/RoomsSection";
import {useAppDispatch} from "~/state/store";
import {pushToast} from "~/state/slices/notificationsSlice";
import {useUser} from "@clerk/react-router";
import {splashes} from "~/lib/splashes";

export function LobbyPage() {
    const [tab, setTab] = React.useState<TabKey>("home");
    const dispatch = useAppDispatch();
    const {user} = useUser();
    const username = user?.firstName ?? user?.username ?? "Coder";

    const splash = splashes[Math.floor(Math.random() * splashes.length)].replace("%username", username)

    function handleJoinUnranked() {
        dispatch(pushToast({text: "Joining unranked queue...", type: "info"}));
    }

    function handleCreatePrivate() {
        dispatch(pushToast({text: "Creating private room...", type: "info"}));
    }

    function handleJoinRoom(roomId: string) {
        dispatch(pushToast({text: `Joining room ${roomId}...`, type: "info"}));
    }

    return (
        <main className="relative min-h-dvh overflow-hidden bg-black text-white">
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#6b7280_1px,transparent_1px)] [background-size:40px_40px]"/>
                <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-fuchsia-600/20 blur-3xl"/>
                <div
                    className="absolute -bottom-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-indigo-600/20 blur-3xl"/>
            </div>

            <section className="relative z-10 flex min-h-dvh flex-col">
                <Header/>

                <div className="mx-auto flex w-full max-w-9/12 flex-1 flex-col items-center px-6 pb-16 pt-8">
                    <div className="flex w-full items-center justify-between">
                        <h1 className="text-2xl font-bold">{splash}</h1>
                        <Tabs value={tab} onChange={setTab}/>
                    </div>

                    <div className="mt-8 w-full space-y-6">
                        {tab === "home" && (
                            <div>
                                <QueueSection onJoinUnranked={handleJoinUnranked}/>
                                <div className="mt-6">
                                    <RoomsSection onJoinRoom={handleJoinRoom} onCreatePrivate={handleCreatePrivate}/>
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
