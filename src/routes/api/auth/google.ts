import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.GOOGLE_CLIENT_ID
        if (!clientId) {
          return new Response("GOOGLE_CLIENT_ID environment variable is not configured.", { status: 500 })
        }

        const url = new URL(request.url)
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host
        const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/callback/google`

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          access_type: "online",
          prompt: "select_account",
        })

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

        return new Response(null, {
          status: 302,
          headers: {
            Location: googleAuthUrl,
          },
        })
      },
    },
  },
})
