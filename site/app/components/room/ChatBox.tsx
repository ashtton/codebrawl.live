import React from "react";
import { useAppDispatch, useAppSelector } from "~/state/store";
import { wsSend } from "~/state/ws/intents";

function avatarFor(seed: string) {
  const s = encodeURIComponent(seed.trim() || Math.random().toString(36).slice(2));
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${s}`;
}

function avatarSrc(imageUrl?: string | null, userId?: string) {
  if (imageUrl && imageUrl.length > 0) return imageUrl;
  return avatarFor(userId || "");
}

export function ChatBox() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.room.chat);
  const room = useAppSelector((s) => s.room.presence.room);
  const [text, setText] = React.useState("");
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [blocked, setBlocked] = React.useState<Set<string>>(() => new Set());
  const autoScrollRef = React.useRef(true);

  function isNearBottom(el: HTMLElement, threshold = 32) {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  }

  function scrollToBottom(el: HTMLElement) {
    el.scrollTop = el.scrollHeight;
  }

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (autoScrollRef.current) scrollToBottom(el);
  }, [messages.length]);

  function onListScroll() {
    const el = listRef.current;
    if (!el) return;
    autoScrollRef.current = isNearBottom(el);
  }

  function send() {
    const msg = text.trim();
    if (!msg || !room) return;
    dispatch(wsSend({ message: { type: "room:chat", code: room.code, message: msg } }));
    setText("");
    const el = listRef.current;
    if (el && autoScrollRef.current) scrollToBottom(el);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-full min-h-64 max-h-[60vh] flex-col rounded-xl border border-white/10 bg-white/5 ring-1 ring-white/10">
      <ul
        ref={listRef}
        onScroll={onListScroll}
        className="flex-1 space-y-2 overflow-y-auto p-3 text-sm"
      >
        {messages.filter((m) => !blocked.has(m.from)).length === 0 && (
          <li className="text-white/60">No messages yet. Say hello.</li>
        )}
        {messages
          .filter((m) => !blocked.has(m.from))
          .map((m, i) => (
            <li key={`${m.ts}-${i}`} className="grid gap-1 rounded-md bg-black/10 p-2 ring-1 ring-white/10">
              <div className="flex items-start gap-2">
                <img
                  src={avatarSrc(m.imageUrl, m.from)}
                  alt={m.username || m.from}
                  className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full ring-1 ring-black/10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/70">
                    <span className="font-medium text-white/90">{m.username && m.username.length > 0 ? m.username : m.from}</span>
                    <a href={`/u/${encodeURIComponent(m.from)}`} className="underline decoration-white/20 hover:text-white">{m.from}</a>
                    <span className="tabular-nums">{new Date(m.ts * 1000).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-white/90 break-words">{m.message}</div>
                  <div className="mt-1 flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setBlocked((prev) => new Set(prev).add(m.from))}
                      className="rounded-md bg-white/10 px-2 py-1 text-white/80 ring-1 ring-white/10 hover:bg-white/15"
                    >
                      Block
                    </button>
                    <a
                      href={`/u/${encodeURIComponent(m.from)}`}
                      className="rounded-md bg-white/10 px-2 py-1 text-white/80 ring-1 ring-white/10 hover:bg-white/15"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-white/10 p-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-md bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/50 ring-1 ring-white/10 focus:outline-none focus:ring-1 focus:ring-blue-600"
          aria-label="Chat message"
          disabled={!room}
        />
        <button
          type="button"
          onClick={send}
          disabled={!room || !text.trim()}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
