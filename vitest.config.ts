import { defineConfig } from "vitest/config"

// Tests skip the app's Vite plugins: TanStack Start would swap server function bodies for RPC stubs.
export default defineConfig({ resolve: { tsconfigPaths: true } })
