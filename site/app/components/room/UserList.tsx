import React from "react";
import { useAppSelector } from "~/state/store";

function avatarFor(seed: string) {
  const s = encodeURIComponent(seed.trim() || Math.random().toString(36).slice(2));
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${s}`;
}

function avatarSrc(imageUrl?: string | null, userId?: string) {
  if (imageUrl && imageUrl.length > 0) return imageUrl;
  return avatarFor(userId || "");
}

export function UserList() {
  const users = useAppSelector((s) => s.room.presence.users);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 ring-1 ring-white/10">
      <h4 className="text-sm font-semibold">Players</h4>
      <ul className="mt-2 grid gap-2">
        {users.length === 0 && (
          <li className="text-sm text-white/60">No players are listed yet.</li>
        )}
        {users.map((u) => (
          <li key={u.userId} className="flex items-center justify-between gap-3 rounded-md bg-black/20 p-2 ring-1 ring-white/10">
            <div className="flex min-w-0 items-center gap-2">
              <img src={avatarSrc(u.imageUrl, u.userId)} alt={u.username || u.userId} className="h-7 w-7 rounded-full ring-1 ring-black/10" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {u.username && u.username.length > 0 ? u.username : u.userId}
                </div>
                <a href={`/u/${encodeURIComponent(u.userId)}`} className="block truncate text-xs text-white/60 underline decoration-white/20 hover:text-white">
                  {u.userId}
                </a>
              </div>
            </div>
            <a
              href={`/u/${encodeURIComponent(u.userId)}`}
              className="text-xs text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
              aria-label={`View ${u.userId}'s profile`}
            >
              Profile
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
