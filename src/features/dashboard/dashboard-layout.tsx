import * as React from "react"
import { useAppTheme } from "@/features/theme/app-theme-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { REGIONS, regionSpan, type RegionId } from "./regions"

/** Client only: it reads the theme's layout and the viewport width. */
export function DashboardLayout({ regions }: { regions: Partial<Record<RegionId, React.ReactNode>> }) {
  const { layout } = useAppTheme().theme
  const isMd = useMediaQuery("(min-width: 768px)")
  const isLg = useMediaQuery("(min-width: 1024px)")
  const entries = REGIONS.filter((r) => regions[r.id] != null)
  const bp = isLg ? "lg" : isMd ? "md" : "base"

  const wrap = (id: RegionId, style?: React.CSSProperties) => (
    <div key={id} data-region={id} className="min-w-0 [&>*]:h-full" style={style}>
      {regions[id]}
    </div>
  )

  if (layout === "split" && isLg) {
    return (
      <div className="grid grid-cols-[22rem_minmax(0,1fr)] items-start gap-(--bb-grid-gap)">
        {(["aside", "main"] as const).map((column) => (
          <div
            key={column}
            className={
              column === "aside"
                ? // scrolls on its own when it is taller than the window, so its end stays reachable
                  "sticky top-[calc(var(--bb-header-h)+1rem)] flex max-h-[calc(100dvh-var(--bb-header-h)-2rem)] flex-col gap-(--bb-grid-gap) overflow-y-auto *:shrink-0"
                : "flex min-w-0 flex-col gap-(--bb-grid-gap)"
            }
          >
            {entries.filter((r) => r.split === column).map((r) => wrap(r.id))}
          </div>
        ))}
      </div>
    )
  }

  const columns = bp === "lg" && layout === "bento" ? 12 : bp !== "base" && layout !== "stack" ? 2 : 1

  return (
    <div
      className="grid gap-(--bb-grid-gap)"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {/* inline styles: Tailwind cannot see computed class names */}
      {entries.map((r) => {
        const span = regionSpan(r.id, layout, bp)
        return wrap(r.id, { gridColumn: `span ${span} / span ${span}` })
      })}
    </div>
  )
}
