import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../state/store";
import { removeToast } from "../state/slices/notificationsSlice";

export function Toasts() {
  const toasts = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dispatch(removeToast(t.id)), 4000));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, dispatch]);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 grid gap-2 z-[60]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={
            `px-3.5 py-2.5 rounded-lg shadow-[0_6px_18px_rgba(0,0,0,0.3)] text-white ` +
            (t.type === 'error' ? 'bg-red-700' : 'bg-neutral-900')
          }
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
