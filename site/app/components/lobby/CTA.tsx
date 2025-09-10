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
                className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-fuchsia-500/20 ring-1 ring-white/10 transition-all hover:from-fuchsia-500 hover:to-indigo-500 hover:shadow-fuchsia-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
                <span className="relative z-10">Join queue</span>
                <span
                    className="absolute inset-0 -z-0 rounded-lg opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-fuchsia-600 to-indigo-600"/>
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
