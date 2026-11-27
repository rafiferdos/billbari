import { defineConfig } from "vitest/config"

// Tests skip the app's Vite plugins: TanStack Start would swap server function bodies for RPC stubs.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  // A shell with Turso credentials must not send test rows to that database; empty means the local file.
  test: { env: { TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "" } },
})
