import React from "react";

type Props = {
    onJoinQueue?: () => void;
    onCreatePrivate?: () => void;
};

export function CTA({onJoinQueue, onCreatePrivate}: Props) {
    return (
        <div className="mt-10 flex flex-col items-center justify-center gap-3">
            <button
                onClick={onJoinQueue}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
                <span>Join queue</span>
            </button>
            <button
                onClick={onCreatePrivate}
                className="text-sm text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
            >
                Create a private room
            </button>
        </div>
    );
}
