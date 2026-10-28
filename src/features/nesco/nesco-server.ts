import { createServerFn } from "@tanstack/react-start"
import { fetchNescoData } from "./nesco-service"
import type { NescoFetchResult } from "./types"

export const getMeterDataFn = createServerFn({ method: "POST" })
  .validator((d: { meterNumber: string; forceSample?: boolean }) => d)
  .handler(async ({ data }): Promise<NescoFetchResult> => {
    return await fetchNescoData(data.meterNumber, data.forceSample)
  })
