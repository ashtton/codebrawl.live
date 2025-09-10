import React from "react";
import {useAppDispatch} from "~/state/store";
import {pushToast} from "~/state/slices/notificationsSlice";

type Props = {
    onJoinUnranked?: () => void;
};

export function QueueSection({onJoinUnranked}: Props) {
    const dispatch = useAppDispatch();

    const [unrankedCount, setUnrankedCount] = React.useState(() => 0);
    const [rankedCount, setRankedCount] = React.useState(() => 0);

    function handleRankedClick(e: React.MouseEvent) {
        e.preventDefault();
        dispatch(pushToast({text: "Ranked queue is currently unavailable", type: "info"}));
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Join Casual Queue</h3>
                    <span
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>
                        {unrankedCount} in queue
          </span>
                </div>
                <p className="mt-1 text-sm text-white/70">Quick play. Get matched with anyone online.</p>
                <button
                    onClick={onJoinUnranked}
                    className="mt-4 group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 ring-1 ring-white/10 transition-all hover:from-fuchsia-500 hover:to-indigo-500 hover:shadow-fuchsia-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                >
                    <span className="relative z-10">Queue for Casual</span>
                    <span
                        className="absolute inset-0 -z-0 rounded-lg opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-fuchsia-600 to-indigo-600"/>
                </button>
            </div>

            <div
                className="rounded-2xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur opacity-80">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Join Ranked Queue</h3>
                    {/*<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">*/}
                    {/*  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />*/}
                    {/*    offline*/}
                    {/*</span>*/}
                </div>
                <p className="mt-1 text-sm text-white/70">Competitive ladder. Coming soon.</p>
                <button
                    onClick={handleRankedClick}
                    disabled
                    className="mt-4 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/60 ring-1 ring-white/10"
                    aria-disabled
                >
                    Unavailable
                </button>
            </div>
        </div>
    );
}

export default QueueSection;
