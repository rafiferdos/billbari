import * as React from "react"

export type ColorTheme =
  | "emerald"
  | "blue"
  | "violet"
  | "rose"
  | "orange"
  | "yellow"
  | "red"
  | "default"

export interface ColorThemeOption {
  id: ColorTheme
  nameBangla: string
  nameEnglish: string
  colorHex: string
  tailwindClass: string
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: "emerald",
    nameBangla: "এমারেল্ড সবুজ",
    nameEnglish: "Emerald Green",
    colorHex: "#10b981",
    tailwindClass: "bg-emerald-500",
  },
  {
    id: "blue",
    nameBangla: "রয়েল ব্লু",
    nameEnglish: "Royal Blue",
    colorHex: "#2563eb",
    tailwindClass: "bg-blue-600",
  },
  {
    id: "violet",
    nameBangla: "ইলেকট্রিক ভায়োলেট",
    nameEnglish: "Electric Violet",
    colorHex: "#7c3aed",
    tailwindClass: "bg-violet-600",
  },
  {
    id: "rose",
    nameBangla: "রোজ পিঙ্ক",
    nameEnglish: "Rose Pink",
    colorHex: "#f43f5e",
    tailwindClass: "bg-rose-500",
  },
  {
    id: "orange",
    nameBangla: "অরেঞ্জ সানসেট",
    nameEnglish: "Amber Orange",
    colorHex: "#f97316",
    tailwindClass: "bg-orange-500",
  },
  {
    id: "yellow",
    nameBangla: "গোল্ডেন ইয়েলো",
    nameEnglish: "Golden Yellow",
    colorHex: "#eab308",
    tailwindClass: "bg-yellow-500",
  },
  {
    id: "red",
    nameBangla: "রুবি রেড",
    nameEnglish: "Ruby Red",
    colorHex: "#ef4444",
    tailwindClass: "bg-red-500",
  },
  {
    id: "default",
    nameBangla: "ডিফল্ট মেজেন্টা",
    nameEnglish: "Classic Magenta",
    colorHex: "#d946ef",
    tailwindClass: "bg-fuchsia-500",
  },
]

const STORAGE_KEY = "billbari_color_theme"

interface ColorThemeContextType {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  activeThemeOption: ColorThemeOption
}

const ColorThemeContext = React.createContext<ColorThemeContextType | null>(null)

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>("emerald")

  // Load from localStorage on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ColorTheme | null
      if (saved && COLOR_THEMES.some((t) => t.id === saved)) {
        setColorThemeState(saved)
        document.documentElement.setAttribute("data-color-theme", saved)
      } else {
        // default to emerald for fresh electricity energy vibe
        document.documentElement.setAttribute("data-color-theme", "emerald")
      }
    } catch {
      document.documentElement.setAttribute("data-color-theme", "emerald")
    }
  }, [])

  const setColorTheme = React.useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
      document.documentElement.setAttribute("data-color-theme", theme)
    } catch {
      // ignore storage error
    }
  }, [])

  const activeThemeOption = React.useMemo(() => {
    return COLOR_THEMES.find((t) => t.id === colorTheme) || COLOR_THEMES[0]
  }, [colorTheme])

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, activeThemeOption }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  const context = React.useContext(ColorThemeContext)
  if (!context) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider")
  }
  return context
}
