Project: codebrawl.live — Frontend (React Router + Vite)

1) Build / configuration

Stack overview
- Runtime/build: React Router v7 + Vite v6, SSR enabled by default (react-router.config.ts: ssr: true).
- Language: TypeScript (ES2022, strict mode, noEmit) with JSX runtime (react-jsx).
- Styling: Tailwind CSS v4 via @tailwindcss/vite plugin.
- State: Redux Toolkit (app/state).
- Auth: @clerk/react-router (be mindful of providers in SSR/client; see “SSR & Providers” below).
- Path alias: ~/* → ./app/* (tsconfig.json).

Node/NPM
- Node 18+ recommended; build verified with Node v22.12.0 and npm 10.9.0.

Install deps
- npm ci (preferred) or npm install

Dev server
- npm run dev
  - React Router dev server with Vite. SSR is on by default; SPA mode can be toggled by setting ssr: false in react-router.config.ts when debugging purely client behavior.

Production build
- npm run build
  - Produces client and server bundles under build/client and build/server.

Serve built output
- npm run start
  - Serves ./build/server/index.js with @react-router/serve.

Type generation and type-checking
- npm run typecheck
  - Runs react-router typegen then tsc. Note: at the time of writing, there are pre-existing TS errors in app/state/ws/socketMiddleware.ts causing typecheck to fail. See Testing notes for current workaround and next steps.

Environment variables
- Clerk: If you wire up authenticated routes/components, ensure appropriate Clerk env configuration (e.g., publishable keys) is provided via Vite env (VITE_*) or server env, depending on usage. Current code references useUser from @clerk/react-router; some pages/components will behave best when wrapped in Clerk providers.
- Vite: Standard Vite env files (.env, .env.local, etc.) work. Ensure not to commit secrets.

2) Testing information

Current state
- There is no unit/integration test framework configured in this repo yet (no jest/vitest/cypress). Type checking also currently fails due to known issues (see above), so CI-style “tests” should focus on smoke validation until types are fixed.

Adding tests going forward
- Preferred: Introduce vitest for unit tests with jsdom/react testing utilities. Minimal steps (to be executed in a dedicated PR):
  - npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
  - Add a vitest config (vite handles most defaults); set test.environment = "jsdom".
  - Example test skeleton (Tabs component):
    
    import { render, screen } from '@testing-library/react'
    import React from 'react'
    import { Tabs } from '~/components/lobby/Tabs'
    
    it('renders Home tab as active', () => {
      render(<Tabs value="home" onChange={() => {}} />)
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument()
    })
  
- SSR/component tests: Components referencing Clerk hooks (e.g., useUser) require wrapping in proper providers/mocks to avoid runtime errors in tests or server-render pipelines.

3) Additional development information

Project layout highlights
- app/index.tsx: Entry for routes. React Router v7 file-based conventions apply under app/.
- app/pages/*: Page-level components (e.g., Lobby.tsx exports LobbyPage as default + named export).
- app/components/*: Reusable UI pieces. Note some files moved into app/components/root (layout/connection overlay) per VCS status.
- app/state/*: Redux Toolkit slices, middleware, and WebSocket intents. Path alias ~/* maps to app/* for clean imports.
- app/lib/*: Project-specific utilities (e.g., splashes.tsx).

Tailwind v4 notes
- Tailwind is enabled via @tailwindcss/vite plugin in vite.config.ts; no separate PostCSS config. Use class utilities directly in JSX. The project uses advanced utility classes and data attributes for styles (e.g., white/10 rings, blur, etc.).

SSR & Providers
- SSR is enabled (react-router.config.ts: ssr: true). Some components use @clerk/react-router hooks (useUser). Rendering those without a provider (or in isolated SSR contexts) may throw or behave unexpectedly. When server-rendering such components (including in tests), wrap with required providers or mock the hooks.

TypeScript & code style
- Strict TS is enabled. Prefer:
  - Function components with explicit prop types.
  - Avoid any; leverage discriminated unions and utility types where helpful.
  - Keep imports using the ~ alias for app-local modules.
  - Consider narrowing nullables aggressively; recent typecheck failure indicates nullable WebSocket handling that needs guards.

Known technical debt (as of this update)
- TypeScript compilation issues in app/state/ws/socketMiddleware.ts around nullable WebSocket and handler types. Addressing this will restore a clean npm run typecheck.

Debugging tips
- Use npm run dev for hot reload and SSR debugging.
- If diagnosing purely client-side behavior, temporarily set ssr: false in react-router.config.ts to simplify the environment.
- Inspect build outputs under build/client/assets and build/server/index.js to confirm emitted bundles when debugging pipeline issues.

Appendix: Quick commands
- Install: npm ci
- Dev: npm run dev
- Build: npm run build
- Serve build: npm run start
- Typegen + TypeScript check: npm run typecheck (currently failing; see notes)

4) Coding Semantics
Base your code style off of an advanced engineer with proper javascript semantics. Do not leave code comments, be concise and consistent.
When creating pages, separate components into files into ~/components/{page}/component.tsx and import them into the page.