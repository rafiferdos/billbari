import { createFileRoute } from "@tanstack/react-router"
import crypto from "node:crypto"
import { getDatabase } from "@/features/db/server-db"

export const Route = createFileRoute("/api/auth/callback/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get("code")
        const error = url.searchParams.get("error")

        if (error || !code) {
          console.error("Google OAuth error:", error || "No code provided")
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/?auth_error=google_failed",
            },
          })
        }

        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          console.error("Google OAuth credentials missing in environment")
          return new Response("Google OAuth credentials missing", { status: 500 })
        }

        // Determine redirect_uri matching Google Cloud Console configuration
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host
        const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/callback/google`

        try {
          // 1. Exchange authorization code for tokens
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }).toString(),
          })

          if (!tokenRes.ok) {
            const errText = await tokenRes.text()
            console.error("Google token exchange error:", errText)
            return new Response(null, {
              status: 302,
              headers: {
                Location: "/?auth_error=token_exchange_failed",
              },
            })
          }

          const tokenData = (await tokenRes.json()) as { access_token: string; id_token?: string }

          // 2. Fetch real user profile from Google UserInfo endpoint
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          })

          if (!userRes.ok) {
            throw new Error("Failed to fetch Google user profile")
          }

          const profile = (await userRes.json()) as {
            sub: string
            name?: string
            email: string
            picture?: string
          }

          const cleanEmail = profile.email.toLowerCase().trim()
          const realName = profile.name || cleanEmail.split("@")[0]
          const avatarUrl = profile.picture || null
          const googleId = profile.sub

          const db = await getDatabase()
          const now = new Date().toISOString()

          // 3. Find or create user in database
          const existingRes = await db.execute({
            sql: `SELECT id FROM users WHERE google_id = ? OR email = ?`,
            args: [googleId, cleanEmail],
          })

          let userId: string
          if (existingRes.rows.length > 0) {
            userId = String(existingRes.rows[0].id)
            await db.execute({
              sql: `
                UPDATE users
                SET name = ?, avatar_url = ?, google_id = ?, updated_at = ?
                WHERE id = ?
              `,
              args: [realName, avatarUrl, googleId, now, userId],
            })
          } else {
            userId = crypto.randomUUID()
            await db.execute({
              sql: `
                INSERT INTO users (id, email, name, google_id, avatar_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `,
              args: [userId, cleanEmail, realName, googleId, avatarUrl, now, now],
            })
          }

          // 4. Create persistent session
          const sessionToken = crypto.randomBytes(32).toString("hex")
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          await db.execute({
            sql: `
              INSERT INTO sessions (token, user_id, expires_at, created_at)
              VALUES (?, ?, ?, ?)
            `,
            args: [sessionToken, userId, expiresAt, now],
          })

          const isHttps = proto === "https" || url.protocol === "https:"
          const secureFlag = isHttps ? "; Secure" : ""

          return new Response(null, {
            status: 302,
            headers: {
              Location: "/?auth_success=google",
              "Set-Cookie": `billbari_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${secureFlag}`,
            },
          })
        } catch (authErr) {
          console.error("Google Auth processing error:", authErr)
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/?auth_error=server_error",
            },
          })
        }
      },
    },
  },
})
