import { describe, expect, it } from "vitest"
import { formatToken, splitTokens } from "../src/features/recharge/token"

describe("formatToken", () => {
  it("groups a 20-digit token in fours, whatever separators it arrived with", () => {
    expect(formatToken("12345678901234567890")).toBe("1234-5678-9012-3456-7890")
    expect(formatToken("1234 5678 9012 3456 7890")).toBe("1234-5678-9012-3456-7890")
    expect(formatToken("1234-5678-9012-3456-7890")).toBe("1234-5678-9012-3456-7890")
  })

  it("leaves anything else as it was, trimmed", () => {
    expect(formatToken(" ABC ")).toBe("ABC")
    expect(formatToken("")).toBe("")
    expect(formatToken("1234567890")).toBe("1234567890")
  })
})

describe("splitTokens", () => {
  it("separates the comma-joined tokens of one vend and formats each", () => {
    expect(splitTokens("12345678901234567890, 09876543210987654321")).toEqual([
      "1234-5678-9012-3456-7890",
      "0987-6543-2109-8765-4321",
    ])
  })

  it("is empty when there is no token", () => {
    expect(splitTokens("")).toEqual([])
    expect(splitTokens(" , ")).toEqual([])
  })
})
