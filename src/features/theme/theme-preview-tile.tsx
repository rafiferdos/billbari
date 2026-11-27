import { useLanguage } from "@/features/i18n/language-context"
import type { ThemeDefinition } from "./themes"

/** A miniature of one theme. Custom properties resolve per element, so the
    root sets its own colors and font. */
export function ThemePreviewTile({ theme }: { theme: ThemeDefinition }) {
  const { formatNumber } = useLanguage()

  return (
    <div
      data-theme={theme.id}
      aria-hidden="true"
      className="pointer-events-none flex h-28 w-full flex-col overflow-hidden bg-background font-sans text-foreground"
    >
      <div
        className="h-4 shrink-0 border-b border-border"
        style={{ background: "var(--bb-header-bg)" }}
      />
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-2">
        <div className="flex items-center justify-between gap-2 surface-card p-2">
          <span className="num text-sm font-bold">
            ৳{formatNumber("1,240")}
          </span>
          <span className="h-4 w-8 rounded-(--bb-control-radius) bg-primary shadow-control" />
        </div>
        <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/40" />
      </div>
    </div>
  )
}
