import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink } from "lucide-react"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { NESCO_LINKS } from "@/features/help/nesco-links"
import { useLanguage } from "@/features/i18n/language-context"

export const Route = createFileRoute("/help")({
  component: HelpPage,
})

function HelpPage() {
  const { t, isBangla } = useLanguage()

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.helpPage.title}</h1>
      <ItemGroup className="grid gap-(--bb-grid-gap) md:grid-cols-2">
        {NESCO_LINKS.map((link) => (
          <div key={link.id} role="listitem">
            <Item
              variant="outline"
              className="h-full flex-nowrap bg-card"
              render={<a href={link.href} target="_blank" rel="noopener noreferrer" />}
            >
              <ItemContent>
                <ItemTitle className="line-clamp-2">{isBangla ? link.nameBn : link.nameEn}</ItemTitle>
                <ItemDescription>{isBangla ? link.descBn : link.descEn}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ExternalLink aria-hidden className="size-4 text-muted-foreground" />
              </ItemActions>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </div>
  )
}
