import type {Route} from "./+types/index"

export function meta({}: Route.MetaArgs) {
    return [
        {title: "codebrawl.live"},
        {
            name: "description",
            content: "Play other developers in a real time coding challenge! Climb the leaderboards and become the quickest coder on the site."
        },
    ];
}

import {useAppSelector} from "./state/store";
import {LobbyPage} from "./pages/Lobby";
import { RoomPage } from "./pages/Room";

function LobbyView() {
    return <LobbyPage/>
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
    const presence = useAppSelector((s) => s.room.presence);
    const inRoomWaiting = !!presence.room && presence.room.state === "lobby";
    return <main className="min-h-dvh bg-black">
        {inRoomWaiting ? <RoomPage/> : null}
        {!inRoomWaiting && mode === "lobby" && <LobbyView/>}
        {!inRoomWaiting && mode === "inGame" && <GameView/>}
        {!inRoomWaiting && mode === "spectating" && <SpectateView/>}
    </main>;
}
