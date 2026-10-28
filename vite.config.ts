import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { nitro } from "nitro/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  const isProd = mode === "production" || process.env.NODE_ENV === "production"
  if (isProd) {
    process.env.NODE_ENV = "production"
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      ...(isProd ? [] : [devtools()]),
      tailwindcss(),
      tanstackStart(),
      nitro(),
      viteReact(),
    ],
    define: {
      "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
    },
  }
})
