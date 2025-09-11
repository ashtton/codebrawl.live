import React from "react";
import { UserButton, useUser } from "@clerk/react-router";
import { Typewriter } from "~/components/common/Typewriter";
import {pushToast} from "~/state/slices/notificationsSlice";
import {useAppDispatch} from "~/state/store";

export function Header() {
  const { user } = useUser();
  const [copied, setCopied] = React.useState(false);
  const dispatch = useAppDispatch()

  const refUrl = React.useMemo(() => {
      const origin = "codebrawl.live"
    return user?.id ? `${origin}/ref/${user.id}` : `${origin}/ref/`;
  }, [user?.id]);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(refUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        dispatch(pushToast({id: "referral", text: "Referral link copied to clipboard", type: "info"}))
      }
    } catch (_) {
      // noop
    }
  }

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 font-mono text-sm text-white/90">
          <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 9l-4 3 4 3"/>
            <path d="M16 9l4 3-4 3"/>
            <path d="M12 8v8"/>
          </svg>
          <div className="relative pr-3 after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-white/30 after:animate-pulse">
            <Typewriter
              items={["Code Brawl", "Compete. Code. Conquer.", "Real-time coding duels", "Sharpen your skills"]}
              className="text-white/90 mr-2"
            />
          </div>
        </div>
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy referral link"}
            className="group inline-flex max-w-[300px] items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[.65rem] text-gray-300 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <svg
              className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <code className="font-mono font-semibold tracking-tight text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
            {refUrl}
          </code>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <UserButton appearance={{ elements: { userButtonPopoverCard: "bg-zinc-900 text-white border border-white/10" } }} />
      </div>
    </header>
  );
}
