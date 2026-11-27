import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink, FileDown } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { useAuth } from "@/features/auth/auth-context"
import { BILLBARI_FAQ, NESCO_LINK_GROUPS } from "@/features/help/faq"
import { NESCO_LINKS } from "@/features/help/nesco-links"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { MeterSearch } from "@/features/meter/meter-search"
import { NESCO_DOWNLOAD_KINDS, nescoDownloadHref } from "@/features/nesco/downloads"

export const Route = createFileRoute("/help")({
  component: HelpPage,
})

function HelpPage() {
  const { t, isBangla } = useLanguage()

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.helpPage.title}</h1>

      <div className="grid gap-(--bb-grid-gap) md:grid-cols-2">
        {NESCO_LINK_GROUPS.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{isBangla ? group.titleBn : group.titleEn}</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemGroup>
                {NESCO_LINKS.filter((link) => group.linkIds.includes(link.id)).map((link) => (
                  <div key={link.id} role="listitem">
                    <Item
                      variant="outline"
                      size="sm"
                      className="flex-nowrap"
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Certificate />
      <Faq />
    </div>
  )
}

function Certificate() {
  const { t } = useLanguage()
  const { activeMeter, activeMeterData: data } = useMeter()
  // the portal has no PDF for sample meters
  const canDownload = data && data.dataSource !== "sample_demo" && NESCO_DOWNLOAD_KINDS.includes("certificate")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.helpPage.certificate}</CardTitle>
        <CardDescription>
          {canDownload ? t.helpPage.certificateReady : t.helpPage.certificateHint}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canDownload ? (
          <a
            href={nescoDownloadHref("certificate", activeMeter)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            <FileDown />
            {t.dashboard.certificate}
          </a>
        ) : (
          <MeterSearch variant="compact" />
        )}
      </CardContent>
    </Card>
  )
}

function Faq() {
  const { t, isBangla } = useLanguage()
  const { openPricingModal } = useAuth()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg">{t.helpPage.faq}</h2>
      <Accordion className="surface-card">
        {BILLBARI_FAQ.map((item) => (
          <AccordionItem key={item.qEn} value={item.qEn}>
            <AccordionTrigger>{isBangla ? item.qBn : item.qEn}</AccordionTrigger>
            <AccordionContent>
              <p>{isBangla ? item.aBn : item.aEn}</p>
              {item.pricing && (
                <Button variant="link" className="h-auto px-0" onClick={openPricingModal}>
                  {t.footer.pricing}
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
