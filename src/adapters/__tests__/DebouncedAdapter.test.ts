import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { DebouncedAdapter } from "../DebouncedAdapter"
import { StorageAdapter } from "../StorageAdapter"
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

class InMemoryAdapter implements StorageAdapter {
  data: Data | null = null
  setCalls = 0

  async get() {
    return this.data
  }
  async set(data: Data) {
    this.data = structuredClone(data)
    this.setCalls++
  }
  async clear() {
    this.data = null
  }
}

describe("DebouncedAdapter", () => {
  let inner: InMemoryAdapter
  let adapter: DebouncedAdapter

  beforeEach(() => {
    vi.useFakeTimers()
    inner = new InMemoryAdapter()
    adapter = new DebouncedAdapter(inner, 100)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not write immediately", async () => {
    await adapter.set(sampleData)
    expect(inner.setCalls).toBe(0)
  })

  it("writes after debounce period", async () => {
    await adapter.set(sampleData)
    vi.advanceTimersByTime(100)
    // Wait for the flush promise to resolve
    await vi.runAllTimersAsync()
    expect(inner.setCalls).toBe(1)
    expect(inner.data).toEqual(sampleData)
  })

  it("coalesces rapid writes", async () => {
    const data1 = { ...sampleData, filters: ["a"] }
    const data2 = { ...sampleData, filters: ["b"] }
    const data3 = { ...sampleData, filters: ["c"] }

    await adapter.set(data1)
    await adapter.set(data2)
    await adapter.set(data3)

    await vi.runAllTimersAsync()
    // Only one write should have happened
    expect(inner.setCalls).toBe(1)
    // With the latest data
    expect(inner.data?.filters).toEqual(["c"])
  })

  it("returns pending data from get()", async () => {
    await adapter.set(sampleData)
    // Not flushed yet, but get() should return pending data
    const result = await adapter.get()
    expect(result).toEqual(sampleData)
  })

  it("returns inner data when nothing is pending", async () => {
    inner.data = sampleData
    const result = await adapter.get()
    expect(result).toEqual(sampleData)
  })

  it("flush() writes immediately", async () => {
    await adapter.set(sampleData)
    await adapter.flush()
    expect(inner.setCalls).toBe(1)
  })

  it("clear() cancels pending writes", async () => {
    await adapter.set(sampleData)
    await adapter.clear()

    await vi.runAllTimersAsync()
    expect(inner.setCalls).toBe(0)
    expect(inner.data).toBeNull()
  })
})
