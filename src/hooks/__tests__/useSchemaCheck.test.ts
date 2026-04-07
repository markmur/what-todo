import { describe, it, expect } from "vitest"
import { useSchemaCheck } from "../useSchemaCheck"
import { SCHEMA_VERSION } from "../../StorageManager"
import { Data } from "../../index.d"

const makeData = (schemaVersion?: number): Data => ({
  schemaVersion,
  filters: [],
  tasks: {},
  labels: [],
  sections: {
    completed: { collapsed: true },
    focus: {},
    sidebar: { collapsed: false }
  }
})

describe("useSchemaCheck", () => {
  it("returns false when not a custom Supabase connection", () => {
    const data = makeData(0)
    expect(useSchemaCheck(data, false)).toBe(false)
  })

  it("returns false when schema version matches current", () => {
    const data = makeData(SCHEMA_VERSION)
    expect(useSchemaCheck(data, true)).toBe(false)
  })

  it("returns true when schema version is missing", () => {
    const data = makeData(undefined)
    expect(useSchemaCheck(data, true)).toBe(true)
  })

  it("returns true when schema version is behind current", () => {
    const data = makeData(SCHEMA_VERSION - 1)
    expect(useSchemaCheck(data, true)).toBe(true)
  })

  it("returns false when schema version is ahead of current", () => {
    const data = makeData(SCHEMA_VERSION + 1)
    expect(useSchemaCheck(data, true)).toBe(false)
  })
})
