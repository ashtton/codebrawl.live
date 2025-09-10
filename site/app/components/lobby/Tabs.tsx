import React from "react";

type TabKey = "home" | "stats" | "friends";

type Props = {
    value: TabKey;
    onChange: (tab: TabKey) => void;
};

export function Tabs({value, onChange}: Props) {
    const base = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
    const active = "bg-white/10 text-white ring-1 ring-white/10";
    const inactive = "text-white/70 hover:text-white hover:bg-white/5";
    return (
        <nav
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur">
            <button className={`${base} ${value === "home" ? active : inactive}`}
                    onClick={() => onChange("home")}>Home
            </button>
            <button className={`${base} ${value === "stats" ? active : inactive}`}
                    onClick={() => onChange("stats")}>Stats
            </button>
            <button className={`${base} ${value === "friends" ? active : inactive}`}
                    onClick={() => onChange("friends")}>Friends
            </button>
        </nav>
    );
}

export type {TabKey};
