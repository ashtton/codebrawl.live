import { authClient } from '#/lib/auth-client'
import { getToken } from '#/lib/auth-server'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'

export const Route = createFileRoute('/lobby/')({
  component: RouteComponent,
  // beforeLoad: async (ctx) => {
  //   if (!await getToken()) {
  //     throw redirect({ to: '/' })
  //   }
  //   console.log(await getToken())
  // },
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <main>
      <Unauthenticated>Logged out</Unauthenticated>
      <Authenticated>Logged in</Authenticated>
      <AuthLoading>Loading...</AuthLoading>
      <button
        onClick={async () => {
          await authClient.signOut()
          await navigate({ to: '/' })
        }}
      >
        Logout
      </button>
    </main>
  )
}
