import React from "react";
import { useAppSelector } from "~/state/store";
import { ChatBox } from "~/components/room/ChatBox";
import { UserList } from "~/components/room/UserList";
import { LeaveRoomButton } from "~/components/room/LeaveRoomButton";

export function RoomPage() {
  const presence = useAppSelector((s) => s.room.presence);
  const room = presence.room;

  if (!room) {
    return (
      <main className="container mx-auto p-4 pt-16">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10">
          <h1 className="text-lg font-semibold">No Room</h1>
          <p className="mt-1 text-sm text-white/70">You are not currently in a room.</p>
        </div>
      </main>
    );
  }

  const humanState = room.state === "lobby" ? "Waiting" : room.state === "in-game" ? "In Game" : "Ended";

  return (
    <main className="container mx-auto p-4 pt-16">
      <div className="grid gap-4">
        <header className="rounded-xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">Room {room.code}</h1>
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
    </main>
  );
}

export default RoomPage;
