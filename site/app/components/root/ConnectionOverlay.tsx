import React from "react";
import {useAppSelector} from "~/state/store";

export function ConnectionOverlay({children}: { children: React.ReactNode }) {
    const conn = useAppSelector((s) => s.connection);
    const show = conn !== "connected";
    return (
        <div className="relative min-h-dvh bg-neutral-950">
            <div className={
                "transition-all duration-500 " +
                (show ? "blur-sm scale-[0.99] opacity-70 pointer-events-none select-none" : "opacity-100")
            }>
                {children}
            </div>
            {show && (
                <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden">
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-950/95 to-black/95 backdrop-blur-md"/>

                    <div className="relative w-[min(92vw,520px)] origin-center rounded-2xl border border-white/10 bg-neutral-900/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-black/40 backdrop-blur-xl text-white
                           animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                        <div
                            className="absolute -inset-px rounded-2xl bg-[radial-gradient(40%_60%_at_50%_-20%,rgba(255,255,255,0.08),rgba(255,255,255,0))] pointer-events-none"/>

                        <div className="mb-3 flex items-center gap-2.5">
                            <span
                                className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400/80 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"/>
                            <div className="text-sm/6 font-medium tracking-wide text-white/90">
                                {conn === "connecting" ? "Connecting to server…" : "Reconnecting…"}
                            </div>
                        </div>

                        <div className="mt-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
                                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 shadow-[0_2px_8px_rgba(59,130,246,0.45)]
                            animate-[progressSlide_1.15s_ease-in-out_infinite]"/>
                            </div>
                            <p className="mt-2 text-xs text-white/60">Hold tight while we establish a secure
                                connection.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
