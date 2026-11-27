import { createFileRoute } from "@tanstack/react-router"
import { useLanguage } from "@/features/i18n/language-context"

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
})

function InsightsPage() {
  const { t } = useLanguage()
  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.nav.insights}</h1>
    </div>
  )
}
