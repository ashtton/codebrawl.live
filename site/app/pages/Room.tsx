import React from "react";
import { useAppDispatch, useAppSelector } from "~/state/store";
import { ChatBox } from "~/components/room/ChatBox";
import { UserList } from "~/components/room/UserList";
import { LeaveRoomButton } from "~/components/room/LeaveRoomButton";
import { pushToast } from "~/state/slices/notificationsSlice";
import { Header } from "~/components/lobby/Header";

export function RoomPage() {
  const presence = useAppSelector((s) => s.room.presence);
  const room = presence.room;

  if (!room) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-black text-white">
        <section className="relative z-10 flex min-h-dvh flex-col">
          <Header />
          <div className="mx-auto flex w-full max-w-9/12 flex-1 flex-col items-center px-6 pb-16 pt-8">
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
              <h1 className="text-lg font-semibold">No Room</h1>
              <p className="mt-1 text-sm text-white/70">You are not currently in a room.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const humanState = room.state === "lobby" ? "Waiting" : room.state === "in-game" ? "In Game" : "Ended";
  const dispatch = useAppDispatch();
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(room.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        dispatch(pushToast({ text: "Room code copied", type: "info" }));
      }
    } catch {}
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <section className="relative z-10 flex min-h-dvh flex-col">
        <Header />
        <div className="mx-auto flex w-full max-w-9/12 flex-1 flex-col px-6 pb-16 pt-8">
          <div className="grid gap-4">
            <header className="rounded-xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">
                      Room <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-white ring-1 ring-white/15">{room.code}</code>
                    </h1>
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label={copied ? "Copied" : "Copy room code"}
                      className="group inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[.7rem] text-gray-300 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-gray-200"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-sm text-white/70">Type: {room.type} · State: {humanState} · Max players: {room.maxUsers}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    {presence.users.length} joined
                  </div>
                  <LeaveRoomButton />
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 ring-1 ring-white/10">
                  <h3 className="text-sm font-semibold">Lobby</h3>
                  <p className="mt-1 text-sm text-white/70">Waiting for players. Chat with others while you wait.</p>
                  <div className="mt-3">
                    <ChatBox />
                  </div>
                </div>
              </div>
              <div>
                <UserList />
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RoomPage;
