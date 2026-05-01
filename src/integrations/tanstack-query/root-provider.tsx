import { QueryClient } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'

export function getContext() {
  const queryClient = new QueryClient()
  const convexQueryClient = new ConvexQueryClient(import.meta.env.VITE_CONVEX_URL)

  return {
    queryClient,
    convexQueryClient,
  }
}

export default function TanstackQueryProvider() {}
