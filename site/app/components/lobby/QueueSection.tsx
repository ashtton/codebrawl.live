import React from "react";
import {useAppDispatch} from "~/state/store";
import {pushToast} from "~/state/slices/notificationsSlice";

type Props = {
    onJoinUnranked?: () => void;
    onCreateRoom?: () => void;
    onJoinPrivate?: () => void;
};

export function QueueSection({onJoinUnranked, onCreateRoom, onJoinPrivate}: Props) {
    const dispatch = useAppDispatch();

    const [unrankedCount, setUnrankedCount] = React.useState(() => 0);
    const [rankedCount, setRankedCount] = React.useState(() => 0);

    function handleRankedClick(e: React.MouseEvent) {
        e.preventDefault();
        dispatch(pushToast({text: "Ranked queue is currently unavailable", type: "info"}));
    }

    return (
        <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Play</h3>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>
                    0 players online
                </span>
            </div>
            <p className="mt-1 text-sm text-white/70">Choose a ladder to play.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="group relative overflow-hidden rounded-xl ring-1 ring-white/10 border border-white/10 bg-gradient-to-br from-emerald-700/70 to-emerald-600/60">
                    <div className="pointer-events-none absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" aria-hidden />
                    <div className="p-5 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M6 10h12a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-1.5a2 2 0 0 1-2-2v-1H10.5v1a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3v-2a2 2 0 0 1 2-2z"/>
                                <circle cx="8.5" cy="12.5" r="0.5"/>
                                <circle cx="15.5" cy="12.5" r="0.5"/>
                            </svg>
                            <h4 className="text-base font-semibold">Casual</h4>
                        </div>
                        <p className="mt-1 text-sm text-white/80">Instant matchmaking. Low stakes, high fun. Great for warm‑ups and quick brawls.</p>
                        <button
                            onClick={onJoinUnranked}
                            className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-white"
                        >
                            <span>Queue for Casual</span>
                        </button>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl ring-1 ring-white/10 border border-white/10 bg-white/5">
                    <div className="p-5 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M8 21h8l1-8H7l1 8z"/>
                                <path d="M7 7h10"/>
                                <path d="M9 7l-1-4h8l-1 4"/>
                            </svg>
                            <h4 className="text-base font-semibold">Ranked</h4>
                        </div>
                        <p className="mt-1 text-sm text-white/70">Competitive ladder with skill‑based matchmaking. Earn ELO, prove your dominance.</p>
                        <button
                            onClick={handleRankedClick}
                            disabled
                            className="mt-4 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white/70 ring-1 ring-white/10"
                            aria-disabled
                        >
                            <span>Queue for Ranked</span>

                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-white/10 border border-white/10 bg-white/5">
                <div className="p-5">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M12 3l7 4v10l-7 4-7-4V7z"/>
                            <path d="M9 12h6"/>
                            <path d="M9 9h6"/>
                        </svg>
                        <h4 className="text-base font-semibold">Private Rooms</h4>
                    </div>
                    <p className="mt-1 text-sm text-white/70">Play games with friends in invite‑only rooms. Share a code or link to jump in together.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            onClick={onCreateRoom}
                            aria-label="Create a private room"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-800"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M12 5v14"/><path d="M5 12h14"/>
                            </svg>
                            <span>Create Room</span>
                        </button>
                        <button
                            onClick={onJoinPrivate}
                            aria-label="Join a private room"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/15"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M15 11a3 3 0 1 0-6 0v2"/>
                                <rect x="6" y="11" width="12" height="9" rx="2"/>
                            </svg>
                            <span>Join Private Room</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QueueSection;
