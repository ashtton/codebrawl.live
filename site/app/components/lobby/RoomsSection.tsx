import React from "react";

type User = {
    id: string;
    name: string;
    avatarUrl?: string;
};

type Room = {
    id: string;
    name: string;
    users: User[];
    capacity: number;
};

type Props = {
    rooms?: Room[];
    onJoinRoom?: (roomId: string) => void;
    onCreatePrivate?: () => void;
    pageSize?: number;
};

function avatarFor(seed: string) {
    const s = encodeURIComponent(seed.trim() || Math.random().toString(36).slice(2));
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${s}`;
}

// const defaultRooms: Room[] = Array.from({length: 17}).map((_, i) => {
//     const cap = 2;
//     const count = (i % 3);
//     const users: User[] = Array.from({length: count}).map((__, j) => {
//         const id = `u${i}-${j}`;
//         const name = j === 0 ? `Player ${i + 1}` : `Guest ${i + 1}-${j}`;
//         return {
//             id,
//             name,
//             avatarUrl: avatarFor(name),
//         };
//     });
//     return {id: `r${i + 1}`, name: i % 2 ? `JavaScript Blitz #${i + 1}` : `Public Room ${i + 1}`, users, capacity: cap};
// });

export function RoomsSection({rooms = [], onJoinRoom, onCreatePrivate, pageSize = 6}: Props) {
    const [page, setPage] = React.useState(1);

    const total = rooms.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const current = rooms.slice(start, end);

    function prev() {
        setPage((p) => Math.max(1, p - 1));
    }

    function next() {
        setPage((p) => Math.min(pages, p + 1));
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Public Rooms</h3>
                <button
                    onClick={onCreatePrivate}
                    className="text-sm text-white/80 underline decoration-white/20 underline-offset-4 hover:text-white"
                >
                    Create a room
                </button>
            </div>

            <ul className="mt-4 divide-y divide-white/10">
                {total === 0 && (
                    <li className="py-6 text-sm text-white/60 text-center">There are currently no public rooms available.</li>
                )}
                {current.map((room) => {
                    const playerCount = room.users.length;
                    const full = playerCount >= room.capacity;
                    const visibleUsers = room.users.slice(0, 5);
                    const overflow = playerCount - visibleUsers.length;
                    const creator = room.users[0]?.name?.trim();
                    const creatorPossessive = creator ? (creator.endsWith("s") || creator.endsWith("S") ? `${creator}'` : `${creator}'s`) : undefined;
                    const displayName = creatorPossessive ? `${creatorPossessive} Room` : room.name;
                    return (
                        <li key={room.id} className="flex items-center justify-between py-3">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{displayName}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex h-8 -space-x-3 items-center">
                                        {visibleUsers.map((u) => (
                                            <img
                                                key={u.id}
                                                src={u.avatarUrl || avatarFor(u.name)}
                                                alt={u.name}
                                                title={u.name}
                                                className="h-5 w-5 rounded-full ring-1 ring-black/10 object-cover"
                                            />
                                        ))}
                                        {overflow > 0 && (
                                            <div
                                                className="inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-black/10 bg-white/10 text-[11px] font-semibold text-white"
                                                title={`${overflow} more`}
                                            >
                                                +{overflow}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-white/60">{playerCount}/{room.capacity} players</span>
                                </div>
                            </div>
                            <button
                                onClick={() => !full && onJoinRoom?.(room.id)}
                                disabled={full}
                                className={
                                    `inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-white/10 ${
                                        full
                                            ? "cursor-not-allowed bg-white/10 text-white/50"
                                            : "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500"
                                    }`
                                }
                                aria-label={full ? `Room ${displayName} is full` : `Join room ${displayName}`}
                            >
                                {full ? "Full" : "Join"}
                            </button>
                        </li>
                    );
                })}
            </ul>

            {pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={prev}
                        disabled={safePage === 1}
                        className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-white/10 ${safePage === 1 ? "cursor-not-allowed bg-white/10 text-white/50" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <div className="text-xs text-white/60">Page {safePage} of {pages}</div>
                    <button
                        onClick={next}
                        disabled={safePage === pages}
                        className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-white/10 ${safePage === pages ? "cursor-not-allowed bg-white/10 text-white/50" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default RoomsSection;
