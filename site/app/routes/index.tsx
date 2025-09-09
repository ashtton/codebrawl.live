import type { Route } from "./+types/index"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

import { useAppSelector } from "../state/store";

function LobbyView() {
  return <div>
    <h1>Lobby</h1>
    <p>Welcome! Waiting for match or join/create a room.</p>
  </div>;
}
function GameView() {
  const matchId = useAppSelector(s => s.appState.inGame?.matchId);
  return <div>
    <h1>In Game</h1>
    <p>Match: {matchId ?? "?"}</p>
  </div>;
}
function SpectateView() {
  const matchId = useAppSelector(s => s.appState.spectating?.matchId);
  return <div>
    <h1>Spectating</h1>
    <p>Watching match: {matchId ?? "?"}</p>
  </div>;
}

export default function Index() {
  const mode = useAppSelector((s) => s.appState.mode);
  return <main className="p-4">
    {mode === "lobby" && <LobbyView />}
    {mode === "inGame" && <GameView />}
    {mode === "spectating" && <SpectateView />}
  </main>;
}
