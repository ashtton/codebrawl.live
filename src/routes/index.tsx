import { authClient } from '#/lib/auth-client'
import { getToken } from '#/lib/auth-server'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'CodeBrawl | Live Coding Duels',
      },
      {
        name: 'description',
        content:
          'Fight other developers in real-time coding challenges. Solve tasks faster, climb the leaderboards, and prove you are the quickest coder.',
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    if (!!await getToken()) {
      throw redirect({ to: '/lobby' })
    }
  },
  component: SignedOutPage,
})

function SignedOutPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-5xl leading-tight font-black tracking-tight text-white sm:text-6xl">
            Code Brawl
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-white/70">
            Fight other developers in real-time coding challenges. Solve tasks faster,
            climb the leaderboards, and prove you&apos;re the quickest coder.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-400/30 bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] ring-1 ring-white/10 transition-[transform,background-color,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-blue-300/60 hover:bg-blue-500 hover:shadow-[0_20px_36px_rgba(59,130,246,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => authClient.signIn.social({ provider: 'github' })}
            >
              <span>Sign in to play</span>
            </button>
          </div>
        </div>

        <FloatingCards />
      </section>
    </main>
  )
}

function FloatingCards() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden justify-center lg:flex"
    >
      <div className="relative h-full w-full max-w-7xl px-12 xl:px-20">
        <Card
          className="left-[2%] top-24 animate-[float_6s_ease-in-out_infinite]"
          codeLines={['function sum(a,b){', '  return a+b', '}']}
        />
        <Card
          className="right-[3%] top-32 animate-[float_7s_ease-in-out_infinite]"
          codeLines={['const arr = [1,2,3]', 'arr.map(x=>x*x)']}
        />
        <Card
          className="left-[6%] bottom-24 animate-[float_8s_ease-in-out_infinite]"
          codeLines={[
            'function readyFight() {',
            '  // 3...2...1...',
            "  setTimeout(() => console.log('FIGHT!'), 1000)",
            "  return 'READY?'",
            '}',
          ]}
        />
        <Card
          className="left-[24%] top-16 animate-[float_9.5s_ease-in-out_infinite]"
          codeLines={['// my debugger', "console.log('it works on my machine!')"]}
        />
        <Card
          className="right-[10%] bottom-56 animate-[float_7.2s_ease-in-out_infinite]"
          codeLines={['// when the tests pass', "function miracle() { return 'magic' }"]}
        />
      </div>
    </div>
  )
}

function Card({
  className,
  codeLines,
}: {
  className?: string
  codeLines: string[]
}) {
  return (
    <div
      className={`absolute rounded-xl border border-white/10 bg-white/10 p-3 text-xs text-white/80 shadow-lg ring-1 ring-white/10 backdrop-blur ${className ?? ''}`}
    >
      <div className="flex items-center gap-1 pb-2">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      <pre className="whitespace-pre leading-5">{codeLines.join('\n')}</pre>
    </div>
  )
}
