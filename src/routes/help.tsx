import { createFileRoute } from "@tanstack/react-router"
import { useLanguage } from "@/features/i18n/language-context"

export const Route = createFileRoute("/help")({
  component: HelpPage,
})

function HelpPage() {
  const { t } = useLanguage()
  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.nav.help}</h1>
    </div>
  )
}
