import {
  bytesToSize,
  formatDateHeading,
  getPastSevenDays,
  parseDataStr,
  preventDefault,
  today,
  yesterday
} from "./utils"

describe("utils", () => {
  describe("today", () => {
    it("should return current date", () => {
      const result = today()
      const now = new Date()

      expect(result.toDateString()).toBe(now.toDateString())
    })
  })

  describe("yesterday", () => {
    it("should return yesterday's date", () => {
      const result = yesterday()
      const expected = new Date()
      expected.setDate(expected.getDate() - 1)

      expect(result.toDateString()).toBe(expected.toDateString())
    })
  })

  describe("getPastSevenDays", () => {
    it("should return 7 days sorted by day number", () => {
      const result = getPastSevenDays()

      expect(result).toHaveLength(7)
      expect(result.every(day => typeof day.number === "number")).toBe(true)
      expect(result.every(day => typeof day.name === "string")).toBe(true)
      expect(result.every(day => day.date instanceof Date)).toBe(true)
    })

    it("should mark today correctly", () => {
      const result = getPastSevenDays()
      const todayItems = result.filter(day => day.isToday)

      expect(todayItems.length).toBeGreaterThan(0)
    })

    it("should return days in ascending order by day number", () => {
      const result = getPastSevenDays()

      for (let i = 1; i < result.length; i++) {
        expect(result[i].number).toBeGreaterThanOrEqual(result[i - 1].number)
      }
    })
  })

  describe("formatDateHeading", () => {
    it("should format date with default options", () => {
      const date = "2024-01-15T12:00:00Z"
      const result = formatDateHeading(date)

      expect(result).toContain("January")
      expect(result).toMatch(/14|15/) // Could be 14 or 15 depending on timezone
    })

    it("should format date with custom options", () => {
      const date = "2024-01-15T12:00:00Z"
      const result = formatDateHeading(date, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })

      expect(result).toContain("2024")
      expect(result).toContain("Jan")
    })
  })

  describe("bytesToSize", () => {
    it("should return empty string for null", () => {
      expect(bytesToSize(null)).toBe("")
    })

    it("should return empty string for undefined", () => {
      expect(bytesToSize(undefined)).toBe("")
    })

    it("should return '0 Byte' for 0 bytes", () => {
      expect(bytesToSize(0)).toBe("0 Byte")
    })

    it("should convert bytes correctly", () => {
      expect(bytesToSize(500)).toBe("500 Bytes")
    })

    it("should convert KB correctly", () => {
      expect(bytesToSize(1024)).toBe("1 KB")
      expect(bytesToSize(2048)).toBe("2 KB")
    })

    it("should convert MB correctly", () => {
      expect(bytesToSize(1024 * 1024)).toBe("1 MB")
      expect(bytesToSize(5 * 1024 * 1024)).toBe("5 MB")
    })

    it("should convert GB correctly", () => {
      expect(bytesToSize(1024 * 1024 * 1024)).toBe("1 GB")
    })

    it("should round values", () => {
      expect(bytesToSize(1536)).toBe("2 KB") // 1.5 KB rounded to 2
    })
  })

  describe("parseDataStr", () => {
    it("should parse valid JSON string", () => {
      const json = '{"name":"test","value":123}'
      const result = parseDataStr(json)

      expect(result).toEqual({ name: "test", value: 123 })
    })

    it("should return empty object for invalid JSON", () => {
      const invalid = "not valid json"
      const result = parseDataStr(invalid)

      expect(result).toEqual({})
    })

    it("should return empty object for empty string", () => {
      const result = parseDataStr("")

      expect(result).toEqual({})
    })

    it("should parse complex nested objects", () => {
      const json = '{"tasks":{"today":[{"id":"1","title":"Test"}]}}'
      const result = parseDataStr(json)

      expect(result).toEqual({
        tasks: { today: [{ id: "1", title: "Test" }] }
      })
    })
  })

  describe("preventDefault", () => {
    it("should call preventDefault and stopPropagation", () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      const mockFn = jest.fn()
      const wrapped = preventDefault(mockFn)

      wrapped(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockFn).toHaveBeenCalledWith(mockEvent)
    })

    it("should pass additional arguments to wrapped function", () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      const mockFn = jest.fn()
      const wrapped = preventDefault(mockFn)

      wrapped(mockEvent, "arg1", "arg2")

      expect(mockFn).toHaveBeenCalledWith(mockEvent, "arg1", "arg2")
    })
  })
})
