import { describe, expect, it } from "vitest"
import { maskMeter, normalizeMeterInput } from "../src/features/meter/meter-input"

describe("normalizeMeterInput", () => {
  it("accepts Bangla digits", () => {
    expect(normalizeMeterInput("১২৩৪৫৬৭৮")).toEqual({ digits: "12345678", error: null })
  })

  it("drops spaces, dashes and pasted labels", () => {
    expect(normalizeMeterInput(" 1234-5678 ").digits).toBe("12345678")
    expect(normalizeMeterInput("Meter: 0123 4567 89")).toEqual({ digits: "0123456789", error: null })
  })

  it("explains what is wrong with the length", () => {
    expect(normalizeMeterInput("").error).toBe("empty")
    expect(normalizeMeterInput("abc").error).toBe("empty")
    expect(normalizeMeterInput("1234").error).toBe("too_short")
    expect(normalizeMeterInput("12345678901").error).toBeNull()
    expect(normalizeMeterInput("123456789012").error).toBe("too_long")
  })
})

describe("maskMeter", () => {
  it("keeps only the last four digits", () => {
    expect(maskMeter("0123456789")).toBe("••••6789")
  })
})
