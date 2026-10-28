import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8 rounded-xl text-muted-foreground">
        <Sun className="size-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="size-8 rounded-xl border border-border/80 flex items-center justify-center hover:bg-muted/70 transition-colors text-foreground cursor-pointer">
          {theme === "dark" ? (
            <Moon className="size-4 text-primary" />
          ) : theme === "light" ? (
            <Sun className="size-4 text-amber-500" />
          ) : (
            <Monitor className="size-4 text-muted-foreground" />
          )}
          <span className="sr-only">থিম পরিবর্তন করুন</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer text-xs"
        >
          <Sun className="size-3.5 text-amber-500" />
          <span>লাইট মোড</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer text-xs"
        >
          <Moon className="size-3.5 text-primary" />
          <span>ডার্ক মোড</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer text-xs"
        >
          <Monitor className="size-3.5 text-muted-foreground" />
          <span>সিস্টেম থিম</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
