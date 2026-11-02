import { createFileRoute } from "@tanstack/react-router"
import { triggerGlobalMidnightCronFn } from "@/features/snapshots/snapshot-server"

export const Route = createFileRoute("/api/cron/daily-pulse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const secret = url.searchParams.get("secret") || request.headers.get("authorization")?.replace("Bearer ", "") || undefined

        try {
          const result = await triggerGlobalMidnightCronFn({ data: { secret } })
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Internal Cron Error"
          return new Response(JSON.stringify({ success: false, error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        }
      },
      POST: async ({ request }) => {
        const url = new URL(request.url)
        const secret = url.searchParams.get("secret") || request.headers.get("authorization")?.replace("Bearer ", "") || undefined

        try {
          const result = await triggerGlobalMidnightCronFn({ data: { secret } })
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Internal Cron Error"
          return new Response(JSON.stringify({ success: false, error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        }
      },
    },
  },
})
