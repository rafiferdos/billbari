import { createFileRoute } from "@tanstack/react-router"
import { registerBridge } from "@/features/nesco/bridge"

export const Route = createFileRoute("/api/nesco/bridge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const accepted = await registerBridge(await request.text(), request.headers.get("x-bridge-signature") ?? "")
        return new Response(null, { status: accepted ? 204 : 401 })
      },
    },
  },
})
