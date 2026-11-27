import { describe, expect, it } from "vitest"
import {
  FEATURES,
  FREE_SAVED_METER_LIMIT,
  canSaveAnotherMeter,
  canUse,
  featuresByTier,
} from "../src/features/payments/entitlements"

describe("entitlement matrix", () => {
  it("keeps everything NESCO shows free", () => {
    const parity = Object.values(FEATURES).filter((f) => f.nescoParity)
    expect(parity).toHaveLength(8)
    expect(parity.every((f) => f.tier === "free")).toBe(true)
  })

  it("splits the tiers as the master plan lists them", () => {
    expect(featuresByTier("free")).toEqual([
      "balance", "customerInfo", "arrearNotice", "rechargeHistory", "tokenReceipt", "monthlyUsage", "nescoDownloads", "nescoServices",
      "freeStats", "tariffTable", "billCalculator", "printView", "recentSearches", "themes",
    ])
    expect(featuresByTier("pro")).toEqual([
      "runway", "dailyBurn", "slabForecast", "seasonality", "costEfficiency", "rechargeBehaviour", "personalInsights", "advancedCharts",
      "snapshots", "autoDailyPulse", "unlimitedSavedMeters", "savedMetersOverview", "lowBalanceAlert", "csvExport",
      "applianceSimulator", "rechargePlanner", "savingPlan",
    ])
  })

  it("has Bangla and English copy for every feature", () => {
    for (const f of Object.values(FEATURES)) {
      for (const text of [f.nameBn, f.nameEn, f.descBn, f.descEn]) expect(text.trim()).not.toBe("")
    }
  })

  it("lets only premium viewers use Pro features", () => {
    expect(canUse("runway", null)).toBe(false)
    expect(canUse("runway", undefined)).toBe(false)
    expect(canUse("runway", { isPremium: false })).toBe(false)
    expect(canUse("runway", { isPremium: true })).toBe(true)
    expect(canUse("balance", null)).toBe(true)
  })

  it("limits free accounts to one saved meter, without blocking re-saves", () => {
    expect(FREE_SAVED_METER_LIMIT).toBe(1)
    expect(canSaveAnotherMeter({ isPremium: false, savedCount: 0, alreadySaved: false })).toBe(true)
    expect(canSaveAnotherMeter({ isPremium: false, savedCount: 1, alreadySaved: false })).toBe(false)
    expect(canSaveAnotherMeter({ isPremium: false, savedCount: 1, alreadySaved: true })).toBe(true)
    expect(canSaveAnotherMeter({ isPremium: true, savedCount: 50, alreadySaved: false })).toBe(true)
  })
})
