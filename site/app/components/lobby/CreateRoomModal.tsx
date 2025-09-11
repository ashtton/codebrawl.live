import React from "react";
import {Modal} from "~/components/common/Modal";
import {useAppDispatch} from "~/state/store";
import {pushToast} from "~/state/slices/notificationsSlice";
import { wsSend } from "~/state/ws/intents";

export type Visibility = "public" | "private";
export type Difficulty = "easy" | "medium" | "hard";
export type Mode = "classic" | "speed";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreateRoom?: () => void;
};

export function CreateRoomModal({open, onClose, onCreateRoom}: Props) {
    const dispatch = useAppDispatch();

    const [visibility, setVisibility] = React.useState<Visibility>("private");
    const [difficulty, setDifficulty] = React.useState<Difficulty>("medium");
    const [mode, setMode] = React.useState<Mode>("classic");
    const [kickOnTabOut, setKickOnTabOut] = React.useState(false);
    const [tab, setTab] = React.useState<"game" | "settings">("game");

    React.useEffect(() => {
        if (!open) return;
        setVisibility("private");
        setDifficulty("medium");
        setMode("classic");
        setKickOnTabOut(false);
        setTab("game");
    }, [open]);

    function handleCreate() {
        if (visibility === "public") {
            const details = `mode: ${mode}, difficulty: ${difficulty}, kick on tab-out: ${kickOnTabOut ? "on" : "off"}`;
            dispatch(pushToast({text: `Creating public room (${details})...`, type: "info"}));
            onClose();
            return;
        }
        dispatch(wsSend({ message: { type: "room:create", roomType: "private" } }));
        onCreateRoom?.();
        onClose();
    }

    return (
        <Modal open={open} onClose={onClose} title="Create Room"
               description="Configure your room and create it when ready.">
            <div className="grid gap-4">
                <div className="flex items-end gap-2 border-b border-white/10">
                    <button
                        type="button"
                        onClick={() => setTab("game")}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "game" ? "border-white text-white" : "border-transparent text-white/80 hover:text-white"}`}
                        aria-pressed={tab === "game"}
                    >
                        Game
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("settings")}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "settings" ? "border-white text-white" : "border-transparent text-white/80 hover:text-white"}`}
                        aria-pressed={tab === "settings"}
                    >
                        Settings
                    </button>
                </div>

                {tab === "game" && (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm text-white/80">Visibility</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVisibility("public")}
                                    className={`rounded-md border border-white/10 p-3 text-left ring-1 ring-white/10 transition-colors ${visibility === "public" ? "bg-emerald-600/80 text-white" : "bg-white/5 ext-white/80 hover:bg-white/10"}`}
                                    aria-pressed={visibility === "public"}
                                >
                                    <div className="font-medium">Public</div>
                                    <div className="text-xs text-white/70">Visible in the lobby; anyone can join.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisibility("private")}
                                    className={`rounded-md border border-white/10 p-3 text-left ring-1 ring-white/10 transition-colors ${visibility === "private" ? "bg-blue-600/80 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"}`}
                                    aria-pressed={visibility === "private"}
                                >
                                    <div className="font-medium">Private</div>
                                    <div className="text-xs text-white/70">Invite-only; join via link or code.</div>
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm text-white/80">Difficulty</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDifficulty("easy")}
                                    className={`rounded-md border p-3 text-left transition-colors ${difficulty === "easy" ? "bg-emerald-600/80 border-green-500/60 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 ring-1 ring-white/10"}`}
                                    aria-pressed={difficulty === "easy"}
                                >
                                    <div className="font-medium">Easy</div>
                                    <div className="text-xs text-white/70">Beginner-friendly with generous time.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDifficulty("medium")}
                                    className={`rounded-md border p-3 text-left transition-colors ${difficulty === "medium" ? "bg-yellow-500/80 border-yellow-500/60 ext-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 ring-1 ring-white/10"}`}
                                    aria-pressed={difficulty === "medium"}
                                >
                                    <div className="font-medium">Medium</div>
                                    <div className="text-xs text-white/70">Balanced problems for a fair duel.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDifficulty("hard")}
                                    className={`rounded-md border p-3 text-left transition-colors ${difficulty === "hard" ? "bg-red-500/80 border-red-500/60 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 ring-1 ring-white/10"}`}
                                    aria-pressed={difficulty === "hard"}
                                >
                                    <div className="font-medium">Hard</div>
                                    <div className="text-xs text-white/70">Tough problems and tighter constraints.</div>
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm text-white/80">Game Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode("classic")}
                                    className={`rounded-md border p-3 text-left transition-colors ${mode === "classic" ? "bg-blue-500/80 border-blue-500/60 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 ring-1 ring-white/10"}`}
                                    aria-pressed={mode === "classic"}
                                >
                                    <div className="font-medium">Classic</div>
                                    <div className="text-xs text-white/70">Standard head-to-head code battle.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("speed")}
                                    className={`rounded-md border p-3 text-left transition-colors ${mode === "speed" ? "bg-emerald-600/80 border-green-500/60 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 ring-1 ring-white/10"}`}
                                    aria-pressed={mode === "speed"}
                                >
                                    <div className="font-medium">Speed</div>
                                    <div className="text-xs text-white/70">Rapid-fire rounds, keep up the pace.</div>
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCreate}
                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-800"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M12 5v14"/>
                                <path d="M5 12h14"/>
                            </svg>
                            <span>Create Room</span>
                        </button>
                    </div>
                )}

                {tab === "settings" && (
                    <div className="grid gap-3">
                        <div
                            className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 ring-1 ring-white/10">
                            <div className="grid">
                                <span className="text-sm font-medium">Kick on tab-out</span>
                                <span
                                    className="text-xs text-white/60">Remove players who leave the tab or window.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setKickOnTabOut(v => !v)}
                                className={`relative h-6 w-11 rounded-full transition-colors ${kickOnTabOut ? "bg-emerald-500" : "bg-white/20"}`}
                                aria-pressed={kickOnTabOut}
                                aria-label="Toggle kick on tab-out"
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white transition-transform ${kickOnTabOut ? "translate-x-5" : ""}`}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default CreateRoomModal;
