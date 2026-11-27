import { Calculator, Camera, History, Home, LifeBuoy, Sparkles, type LucideIcon } from "lucide-react"
import type { Translations } from "@/features/i18n/translations"

export interface NavItem {
  to: "/" | "/history" | "/insights" | "/tariffs" | "/snapshots" | "/help"
  labelKey: keyof Translations["nav"]
  icon: LucideIcon
  pro?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "home", icon: Home },
  { to: "/history", labelKey: "history", icon: History },
  { to: "/insights", labelKey: "insights", icon: Sparkles, pro: true },
  { to: "/tariffs", labelKey: "tools", icon: Calculator },
  { to: "/snapshots", labelKey: "tracking", icon: Camera, pro: true },
  { to: "/help", labelKey: "help", icon: LifeBuoy },
]

export const DOCK_ITEM_COUNT = 4
