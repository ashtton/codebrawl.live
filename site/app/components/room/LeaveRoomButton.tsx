import React from "react";
import { useAppDispatch, useAppSelector } from "~/state/store";
import { wsSend } from "~/state/ws/intents";
import { useNavigate } from "react-router";
import { resetRoom } from "~/state/slices/roomSlice";

export function LeaveRoomButton() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const room = useAppSelector((s) => s.room.presence.room);

  function onLeave() {
    const code = room?.code;
    if (code) {
      dispatch(wsSend({ message: { type: "room:leave", code } }));
    }
    dispatch(resetRoom());
    navigate("/");
  }

  if (!room) return null;

  return (
    <button
      type="button"
      onClick={onLeave}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/10"
      aria-label="Leave room"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      <span>Leave</span>
    </button>
  );
}

export default LeaveRoomButton;
