import { describe, it, expect, beforeEach, vi } from "vitest"
import { Data } from "../../index.d"

const mockUserId = "user-123"
let rows: Record<string, unknown> = {}
let shouldError: string | null = null
let authUser: { id: string } | null = { id: mockUserId }

vi.mock("../../lib/supabase", () => {
  const from = (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => {
          if (shouldError)
            return { data: null, error: { message: shouldError } }
          return { data: rows[table] ?? null, error: null }
        }
      })
    }),
    upsert: async (payload: unknown) => {
      if (shouldError) return { error: { message: shouldError } }
      rows[table] = payload
      return { error: null }
    },
    delete: () => ({
      neq: async () => {
        if (shouldError) return { error: { message: shouldError } }
        delete rows[table]
        return { error: null }
      }
    })
  })

  return {
    supabase: {
      from,
      auth: {
        getUser: async () => ({
          data: { user: authUser }
        })
      }
    }
  }
})

const sampleData: Data = {
  schemaVersion: 1,
  filters: [],
  tasks: {},
  labels: [{ id: "1", title: "Work", color: "#000" }],
  sections: {
    completed: { collapsed: true },
    focus: {},
    sidebar: { collapsed: false }
  }
}

describe("AppSupabaseAdapter", () => {
  let adapter: import("../AppSupabaseAdapter").AppSupabaseAdapter

  beforeEach(async () => {
    rows = {}
    shouldError = null
    authUser = { id: mockUserId }
    const { AppSupabaseAdapter } = await import("../AppSupabaseAdapter")
    adapter = new AppSupabaseAdapter()
  })

  it("returns null when no data exists", async () => {
    const result = await adapter.get()
    expect(result).toBeNull()
  })

  it("stores and retrieves data", async () => {
    await adapter.set(sampleData)
    // Simulate what the DB returns — the stored payload
    rows["todos"] = { data: sampleData }
    const result = await adapter.get()
    expect(result).toEqual(sampleData)
  })

  it("includes user_id in upsert payload", async () => {
    await adapter.set(sampleData)
    const stored = rows["todos"] as Record<string, unknown>
    expect(stored.user_id).toBe(mockUserId)
  })

  it("throws when not authenticated", async () => {
    authUser = null
    await expect(adapter.set(sampleData)).rejects.toThrow("Not authenticated")
  })

  it("throws on get error", async () => {
    rows["todos"] = { data: sampleData }
    shouldError = "connection failed"
    await expect(adapter.get()).rejects.toThrow("AppSupabaseAdapter get failed")
  })

  it("throws on set error", async () => {
    shouldError = "write failed"
    await expect(adapter.set(sampleData)).rejects.toThrow(
      "AppSupabaseAdapter set failed"
    )
  })

  it("clears data", async () => {
    rows["todos"] = { data: sampleData }
    await adapter.clear()
    expect(rows["todos"]).toBeUndefined()
  })
})
