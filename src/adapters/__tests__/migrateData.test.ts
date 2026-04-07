import { describe, it, expect, beforeEach } from "vitest"
import { migrateData } from "../migrateData"
import { StorageAdapter } from "../StorageAdapter"
import { LocalStorageAdapter } from "../LocalStorageAdapter"
import { Data } from "../../index.d"

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

/** In-memory adapter so source and target are truly independent. */
class InMemoryAdapter implements StorageAdapter {
  private data: Data | null = null

  async get() {
    return this.data
  }
  async set(data: Data) {
    this.data = structuredClone(data)
  }
  async clear() {
    this.data = null
  }

  seed(data: Data) {
    this.data = structuredClone(data)
  }
}

describe("migrateData", () => {
  let source: InMemoryAdapter
  let target: InMemoryAdapter

  beforeEach(() => {
    source = new InMemoryAdapter()
    target = new InMemoryAdapter()
  })

  it("copies data from source to target", async () => {
    source.seed(sampleData)

    const result = await migrateData(source, target)

    expect(result).toBe(true)
    const retrieved = await target.get()
    expect(retrieved).toEqual(sampleData)
  })

  it("returns false when source is empty", async () => {
    const result = await migrateData(source, target)

    expect(result).toBe(false)
    const retrieved = await target.get()
    expect(retrieved).toBeNull()
  })

  it("overwrites existing target data", async () => {
    const oldData = { ...sampleData, filters: ["old-filter"] }
    target.seed(oldData)
    source.seed(sampleData)

    await migrateData(source, target)

    const retrieved = await target.get()
    expect(retrieved).toEqual(sampleData)
    expect(retrieved?.filters).toEqual([])
  })

  it("does not modify or clear the source adapter", async () => {
    source.seed(sampleData)

    await migrateData(source, target)

    // Source must still have its original data intact
    const sourceData = await source.get()
    expect(sourceData).toEqual(sampleData)
  })

  it("propagates errors from source.get()", async () => {
    const failingSource: StorageAdapter = {
      get: () => Promise.reject(new Error("read failed")),
      set: () => Promise.resolve(),
      clear: () => Promise.resolve()
    }

    await expect(migrateData(failingSource, target)).rejects.toThrow(
      "read failed"
    )
  })

  it("propagates errors from target.set()", async () => {
    source.seed(sampleData)

    const failingTarget: StorageAdapter = {
      get: () => Promise.resolve(null),
      set: () => Promise.reject(new Error("write failed")),
      clear: () => Promise.resolve()
    }

    await expect(migrateData(source, failingTarget)).rejects.toThrow(
      "write failed"
    )
  })

  it("preserves localStorage when migrating to a different adapter", async () => {
    // Simulate the real connect flow: data lives in localStorage,
    // we migrate to an in-memory "Supabase" target.
    const localAdapter = new LocalStorageAdapter()
    await localAdapter.set(sampleData)

    const supabaseTarget = new InMemoryAdapter()
    await migrateData(localAdapter, supabaseTarget)

    // localStorage must still have the original data
    const localData = await localAdapter.get()
    expect(localData).toEqual(sampleData)

    // Target got a copy
    const targetData = await supabaseTarget.get()
    expect(targetData).toEqual(sampleData)
  })
})
