import { createFileRoute } from "@tanstack/react-router"
import { buildDownloadFilename, isPdfContentType, parseDownloadQuery } from "@/features/nesco/downloads"
import { NESCO_SUBMIT, openNescoSession, postNescoForm } from "@/features/nesco/nesco-session"
import { SAMPLE_METERS } from "@/features/nesco/sample-data"

const NO_PDF = "নেসকো পোর্টাল এই মুহূর্তে PDF দিচ্ছে না। একটু পরে আবার চেষ্টা করুন।"
const SUBMIT = {
  certificate: NESCO_SUBMIT.certificate,
  recharge: NESCO_SUBMIT.rechargePdf,
  monthly: NESCO_SUBMIT.monthlyPdf,
}

const fail = (status: number, error: string) => Response.json({ error }, { status })

export const Route = createFileRoute("/api/nesco/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const query = parseDownloadQuery({ kind: params.get("kind"), meter: params.get("meter") })
        if (!query.ok) return fail(400, query.error)
        const { kind, meter } = query
        // Sample numbers may belong to a real customer; never fetch their documents.
        if (meter in SAMPLE_METERS) return fail(404, "নমুনা মিটারের কোনো PDF নেই।")

        try {
          const res = await postNescoForm(await openNescoSession(), meter, SUBMIT[kind])
          if (!res.ok || !isPdfContentType(res.headers.get("content-type"))) return fail(502, NO_PDF)

          return new Response(res.body, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${buildDownloadFilename(kind, meter)}"`,
              "Cache-Control": "no-store",
            },
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : ""
          console.warn("[NESCO download warning]:", message)
          // Our session errors are written in Bangla; network and timeout errors are not.
          return fail(502, /[ঀ-৿]/.test(message) ? message : NO_PDF)
        }
      },
    },
  },
})
