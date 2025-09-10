import React from "react";

export type TypewriterProps = {
  items: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
  className?: string;
  cursorClassName?: string;
};

export function Typewriter({
  items,
  typingSpeedMs = 120,
  deletingSpeedMs = 85,
  pauseMs = 2200,
  className = "",
  cursorClassName = "",
}: TypewriterProps) {
  const [index, setIndex] = React.useState(0);
  const [display, setDisplay] = React.useState("");
  const [phase, setPhase] = React.useState<"typing" | "pausing" | "deleting">("typing");

  const current = items.length > 0 ? items[index % items.length] : "";

  React.useEffect(() => {
    if (items.length === 0) return;

    let timer: number | undefined;

    if (phase === "typing") {
      if (display.length < current.length) {
        timer = window.setTimeout(() => {
          setDisplay(current.slice(0, display.length + 1));
        }, typingSpeedMs);
      } else {
        setPhase("pausing");
      }
    } else if (phase === "pausing") {
      timer = window.setTimeout(() => setPhase("deleting"), pauseMs);
    } else if (phase === "deleting") {
      if (display.length > 0) {
        timer = window.setTimeout(() => {
          setDisplay(current.slice(0, display.length - 1));
        }, deletingSpeedMs);
      } else {
        setPhase("typing");
        setIndex((i) => (i + 1) % items.length);
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [items.length, current, display.length, phase, typingSpeedMs, deletingSpeedMs, pauseMs]);

  // Render is SSR-safe: no window access here; effects run only on client.
  return (
    <span className={`inline-flex items-center font-mono ${className}`}>
      <span>{display}</span>
      <span
        aria-hidden
        className={`ml-[1px] inline-block w-[0.6ch] translate-y-[1px] select-none text-blue-400 opacity-100 animate-[blink_0.75s_steps(1,start)_infinite] ${cursorClassName}`}
      >
        _
      </span>
      <style>{`@keyframes blink{0%{opacity:0}50%{opacity:0}100%{opacity:1}}`}</style>
    </span>
  );
}
