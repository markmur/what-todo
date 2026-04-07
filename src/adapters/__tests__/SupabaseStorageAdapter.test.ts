import { describe, it, expect, beforeEach, vi } from "vitest"
import { Data } from "../../index.d"

// Shared mock state — reset in beforeEach
let rows: Record<string, unknown> = {}
let shouldError: string | null = null

vi.mock("@supabase/supabase-js", () => {
  const from = () => ({
    select: () => ({
      eq: (_col: string, val: string) => ({
        maybeSingle: async () => {
          if (shouldError)
            return { data: null, error: { message: shouldError } }
          const key = `what_todo_data:${val}`
          return { data: rows[key] ?? null, error: null }
        },
        single: async () => {
          if (shouldError)
            return { data: null, error: { message: shouldError } }
          const key = `what_todo_data:${val}`
          return { data: rows[key] ?? null, error: null }
        }
      }),
      limit: () =>
        Promise.resolve(
          shouldError
            ? { data: null, error: { message: shouldError } }
            : { data: [], error: null }
        )
    }),
    upsert: async (row: Record<string, unknown>) => {
      if (shouldError) return { error: { message: shouldError } }
      const key = `what_todo_data:${row.id}`
      rows[key] = row
      return { error: null }
    },
    delete: () => ({
      eq: async (_col: string, val: string) => {
        if (shouldError) return { error: { message: shouldError } }
        const key = `what_todo_data:${val}`
        delete rows[key]
        return { error: null }
      }
    })
  })

  return {
    createClient: () => ({ from })
  }
})

// Import after mock is set up
import {
  SupabaseStorageAdapter,
  SupabaseStorageError
} from "../SupabaseStorageAdapter"

const sampleData: Data = {
  filters: [],
  tasks: {},
  labels: [{ id: "1", title: "Work", color: "#000" }],
  sections: {
    completed: { collapsed: true },
    focus: {},
    sidebar: { collapsed: false }
  }
}

function createAdapter() {
  return new SupabaseStorageAdapter("https://test.supabase.co", "test-anon-key")
}

describe("SupabaseStorageAdapter", () => {
  let adapter: SupabaseStorageAdapter

  beforeEach(() => {
    rows = {}
    shouldError = null
    adapter = createAdapter()
  })

  it("returns null when no data is stored", async () => {
    const data = await adapter.get()
    expect(data).toBeNull()
  })

  it("stores and retrieves data", async () => {
    await adapter.set(sampleData)
    const retrieved = await adapter.get()
    expect(retrieved).toEqual(sampleData)
  })

  it("all instances share the same row", async () => {
    // Simulate two devices connecting with the same credentials
    const device1 = createAdapter()
    const device2 = createAdapter()

    await device1.set(sampleData)
    const retrieved = await device2.get()
    expect(retrieved).toEqual(sampleData)
  })

  it("last write wins across devices", async () => {
    const device1 = createAdapter()
    const device2 = createAdapter()

    await device1.set(sampleData)
    const updated = { ...sampleData, filters: ["label-1"] }
    await device2.set(updated)

    const result = await device1.get()
    expect(result?.filters).toEqual(["label-1"])
  })

  it("clears stored data", async () => {
    await adapter.set(sampleData)
    await adapter.clear()
    const retrieved = await adapter.get()
    expect(retrieved).toBeNull()
  })

  it("testConnection does not throw for a valid setup", async () => {
    await expect(adapter.testConnection()).resolves.toBeUndefined()
  })

  it("throws SupabaseStorageError on get() failure", async () => {
    shouldError = "network timeout"
    await expect(adapter.get()).rejects.toThrow(SupabaseStorageError)
    await expect(adapter.get()).rejects.toThrow("network timeout")
  })

  it("throws SupabaseStorageError on set() failure", async () => {
    shouldError = "permission denied"
    await expect(adapter.set(sampleData)).rejects.toThrow(SupabaseStorageError)
    await expect(adapter.set(sampleData)).rejects.toThrow("permission denied")
  })

  it("throws SupabaseStorageError on clear() failure", async () => {
    shouldError = "server error"
    await expect(adapter.clear()).rejects.toThrow(SupabaseStorageError)
  })

  it("throws on testConnection() failure with descriptive message", async () => {
    shouldError = "relation does not exist"
    await expect(adapter.testConnection()).rejects.toThrow(
      /Could not connect to Supabase/
    )
    await expect(adapter.testConnection()).rejects.toThrow(/what_todo_data/)
  })

  it("rejects invalid Supabase URLs", () => {
    expect(() => new SupabaseStorageAdapter("http://evil.com", "key")).toThrow(
      /Invalid Supabase URL/
    )
  })
})
