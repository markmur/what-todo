import { describe, it, expect } from "vitest"
import { contrastText, parseDataStr, getPastSevenDays } from "./utils"

describe("contrastText", () => {
  it("returns black for light backgrounds", () => {
    expect(contrastText("#ffffff")).toBe("#000000")
    expect(contrastText("#f5f5f5")).toBe("#000000")
    expect(contrastText("#ffff00")).toBe("#000000")
  })

  it("returns white for dark backgrounds", () => {
    expect(contrastText("#000000")).toBe("#ffffff")
    expect(contrastText("#151925")).toBe("#ffffff")
    expect(contrastText("#3b82f6")).toBe("#ffffff")
  })

  it("handles hex without leading #", () => {
    // The function calls hex.replace("#", "") so it works either way
    expect(contrastText("ffffff")).toBe("#000000")
    expect(contrastText("000000")).toBe("#ffffff")
  })

  it("returns white for mid-dark colors", () => {
    expect(contrastText("#8b5cf6")).toBe("#ffffff")
  })

  it("returns black for mid-light colors", () => {
    expect(contrastText("#fde68a")).toBe("#000000")
  })
})

describe("parseDataStr", () => {
  it("parses valid JSON", () => {
    expect(parseDataStr('{"key":"value"}')).toEqual({ key: "value" })
  })

  it("returns empty object for invalid JSON", () => {
    expect(parseDataStr("not json")).toEqual({})
    expect(parseDataStr("")).toEqual({})
    expect(parseDataStr("{broken")).toEqual({})
  })

  it("returns empty object for empty string", () => {
    expect(parseDataStr("")).toEqual({})
  })
})

describe("getPastSevenDays", () => {
  it("returns exactly 7 days", () => {
    expect(getPastSevenDays()).toHaveLength(7)
  })

  it("includes today", () => {
    const days = getPastSevenDays()
    expect(days.some(d => d.isToday)).toBe(true)
  })

  it("marks exactly one day as today", () => {
    const days = getPastSevenDays()
    expect(days.filter(d => d.isToday)).toHaveLength(1)
  })

  it("returns days sorted by day number ascending", () => {
    const days = getPastSevenDays()
    const numbers = days.map(d => d.number)
    // Allow for month boundaries — just check it's sorted
    const sorted = [...numbers].sort((a, b) => a - b)
    expect(numbers).toEqual(sorted)
  })

  it("each day has a 3-char name", () => {
    const days = getPastSevenDays()
    days.forEach(d => {
      expect(d.name).toHaveLength(3)
    })
  })
})
