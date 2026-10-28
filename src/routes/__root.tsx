import * as React from "react"
import { HeadContent, Scripts, createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DbProvider } from "@tanstack/react-db"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/features/auth/auth-context"
import { AuthDialog } from "@/features/auth/auth-dialog"
import { PricingDialog } from "@/features/payments/pricing-dialog"
import { dbClient } from "@/features/db/client-db"

import appCss from "../styles.css?url"

let queryClientInstance: QueryClient | null = null
function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          retry: 1,
        },
      },
    })
  }
  return queryClientInstance
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "বিলবাড়ি - নেসকো প্রিপেইড বিদ্যুৎ সহজ হিসাব",
      },
      {
        name: "description",
        content: "নেসকো প্রিপেইড মিটার গ্রাহকদের জন্য বিদ্যুৎ বিল ও রিচার্জ খরচের সহজ হিসাব প্ল্যাটফর্ম।",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16 text-center">
      <h1 className="text-3xl font-extrabold">৪০৪</h1>
      <p className="text-muted-foreground mt-2">কাঙ্ক্ষিত পৃষ্ঠাটি পাওয়া যায়নি।</p>
    </main>
  ),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const queryClient = getQueryClient()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <DbProvider client={dbClient}>
          <TooltipProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <Outlet />
                </main>
                <Footer />
                <AuthDialog />
                <PricingDialog />
                <Toaster position="top-right" />
              </div>
            </AuthProvider>
          </TooltipProvider>
        </DbProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {import.meta.env.PROD ? null : (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
