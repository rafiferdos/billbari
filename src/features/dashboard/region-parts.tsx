import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { useLanguage } from "@/features/i18n/language-context"

/** Marks a number BillBari computed, as opposed to one NESCO reported. */
export function EstimateBadge() {
  const { t } = useLanguage()
  return <Badge variant="outline">{t.common.estimate}</Badge>
}

export function EmptyRegion({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1">
        <Empty className="p-4">
          <EmptyHeader>
            <EmptyTitle className="text-sm">{message}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

export function StatRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="num flex items-center gap-2 text-right font-semibold">{value}</span>
    </div>
  )
}
