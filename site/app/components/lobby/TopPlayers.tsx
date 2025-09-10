import React from "react";

export type TopPlayer = {
  id: string;
  username: string;
  avatarUrl?: string;
  elo: number;
};

type Props = {
  players?: TopPlayer[];
  title?: string;
};

const defaultPlayers: TopPlayer[] = [
  // { id: "1", username: "Ada", elo: 2410, avatarUrl: "/avatars/ada.png" },
  // { id: "2", username: "Linus", elo: 2335, avatarUrl: "/avatars/linus.png" },
  // { id: "3", username: "Grace", elo: 2290, avatarUrl: "/avatars/grace.png" },
  // { id: "4", username: "Edsger", elo: 2250, avatarUrl: "/avatars/edsger.png" },
  // { id: "5", username: "Guido", elo: 2215, avatarUrl: "/avatars/guido.png" },
];

export function TopPlayers({ players = defaultPlayers, title = "Top ELO" }: Props) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/50">All time</div>
          <h3 className="text-lg font-semibold mt-1">{title}</h3>
        </div>
        <a href="/leaderboard" className="text-xs text-white/80 underline decoration-white/20 underline-offset-4 hover:text-white">View more</a>
      </div>
      <ol className="mt-4 space-y-3">
        {players.slice(0, 5).map((p, idx) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-6 text-right text-sm text-white/60">{idx + 1}.</span>
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={p.username}
                className="h-8 w-8 rounded-full border border-white/10 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-8 w-8 rounded-full border border-white/10 bg-white/10" />
            )}
            <div className="flex min-w-0 flex-1 items-baseline justify-between">
              <span className="truncate font-medium">{p.username}</span>
              <span className="ml-3 shrink-0 text-sm text-white/70">{p.elo}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default TopPlayers;
