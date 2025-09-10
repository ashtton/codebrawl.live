import React from "react";
import {SignInButton} from "@clerk/react-router";

export function SignedOutPage() {
    return (
        <main className="relative min-h-dvh overflow-hidden bg-black text-white">
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#6b7280_1px,transparent_1px)] [background-size:40px_40px]"/>
                <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-fuchsia-600/20 blur-3xl"/>
                <div
                    className="absolute -bottom-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-indigo-600/20 blur-3xl"/>
            </div>

            <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-24">
                <div className="mx-auto max-w-5xl text-center">
          <span
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-widest text-white/80 shadow ring-1 ring-white/10 backdrop-blur">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>
            0 players currently playing
          </span>

                    <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight sm:text-6xl">
                        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Code Brawl</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-white/70">
                        Fight other developers in real‑time coding challenges. Solve tasks faster, climb the
                        leaderboards, and prove you’re the quickest coder.
                    </p>

                    <div className="mt-10 flex items-center justify-center gap-4">
                        <SignInButton>
                            <button
                                className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-fuchsia-500/20 ring-1 ring-white/10 transition-all hover:from-fuchsia-500 hover:to-indigo-500 hover:shadow-fuchsia-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400">
                                <span className="relative z-10">Sign in to play</span>
                                <span
                                    className="absolute inset-0 -z-0 rounded-lg opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-fuchsia-600 to-indigo-600"/>
                            </button>
                        </SignInButton>
                    </div>

                </div>

                <FloatingCards/>
            </section>
        </main>
    );
}

function FloatingCards() {
    return (
        <div aria-hidden className="hidden absolute lg:block pointer-events-none inset-0 z-0">
            <Card className="left-6 top-24 animate-[float_6s_ease-in-out_infinite]"
                  codeLines={["function sum(a,b){", "  return a+b", "}"]}/>
            <Card className="right-8 top-32 animate-[float_7s_ease-in-out_infinite]"
                  codeLines={["const arr = [1,2,3]", "arr.map(x=>x*x)"]}/>
            <Card
                className="left-16 bottom-24 animate-[float_8s_ease-in-out_infinite]"
                codeLines={[
                    "function readyFight() {",
                    "  // 3...2...1...",
                    "  setTimeout(() => console.log('🥊 FIGHT!'), 1000)",
                    "  return '🔥 READY?'",
                    "}"
                ]}
            />
            <Card className="left-[20rem] top-[4rem] animate-[float_9.5s_ease-in-out_infinite]"
                  codeLines={["// my debugger", "console.log('it works on my machine!🤷‍♂️')"]}/>
            <Card className="right-[4rem] bottom-[14rem] animate-[float_7.2s_ease-in-out_infinite]"
                  codeLines={["// when the tests pass", "function miracle() { return '✨magic✨' }"]}/>
        </div>
    );
}

function Card({className, codeLines}: { className?: string; codeLines: string[] }) {
    return (
        <div
            className={`absolute rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-3 text-xs text-white/80 shadow-lg ring-1 ring-white/10 backdrop-blur ${className ?? ""}`}>
            <div className="flex items-center gap-1 pb-2">
                <span className="h-2 w-2 rounded-full bg-red-400"/>
                <span className="h-2 w-2 rounded-full bg-yellow-400"/>
                <span className="h-2 w-2 rounded-full bg-emerald-400"/>
            </div>
            <pre className="whitespace-pre leading-5">
        {codeLines.join("\n")}
      </pre>
        </div>
    );
}
