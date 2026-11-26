import * as React from "react"
import {
  DEFAULT_THEME_ID,
  THEMES,
  THEME_META,
  resolveThemeId,
} from "./themes"
import type { ThemeDefinition, ThemeId } from "./themes"

export const THEME_STORAGE_KEY = "billbari_theme"

/** Runs in <head> before first paint, so the stored theme never flashes. */
export function getThemeInitScript(): string {
  return `(function(){var m=${JSON.stringify(THEME_META)},id=${JSON.stringify(DEFAULT_THEME_ID)};try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(Object.prototype.hasOwnProperty.call(m,s))id=s}catch(e){}var d=document.documentElement.dataset;d.theme=id;d.layout=m[id].layout;d.nav=m[id].nav})()`
}

interface AppThemeContextValue {
  themeId: ThemeId
  theme: ThemeDefinition
  setThemeId: (id: ThemeId) => void
}

const AppThemeContext = React.createContext<AppThemeContextValue | null>(null)

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = React.useState<ThemeId>(DEFAULT_THEME_ID)

  // The init script already applied the stored theme; read it back.
  React.useEffect(() => {
    setThemeIdState(resolveThemeId(document.documentElement.dataset.theme))
  }, [])

  const setThemeId = React.useCallback((id: ThemeId) => {
    setThemeIdState(id)
    const { dataset } = document.documentElement
    dataset.theme = id
    dataset.layout = THEME_META[id].layout
    dataset.nav = THEME_META[id].nav
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
  }, [])

  const value = React.useMemo(
    () => ({ themeId, theme: THEMES[themeId], setThemeId }),
    [themeId, setThemeId]
  )

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  const context = React.useContext(AppThemeContext)
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider")
  }
  return context
}
