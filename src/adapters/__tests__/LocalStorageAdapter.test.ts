import { describe, it, expect, beforeEach } from "vitest"
import { LocalStorageAdapter } from "../LocalStorageAdapter"
import { Data } from "../../index.d"

const STORAGE_KEY = "what-todo"

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

describe("LocalStorageAdapter", () => {
  let adapter: LocalStorageAdapter

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter()
  })

  it("returns null when nothing is stored", async () => {
    const data = await adapter.get()
    expect(data).toBeNull()
  })

  it("stores and retrieves data", async () => {
    await adapter.set(sampleData)
    const retrieved = await adapter.get()
    expect(retrieved).toEqual(sampleData)
  })

  it("overwrites existing data on set", async () => {
    await adapter.set(sampleData)

    const updated = { ...sampleData, filters: ["label-1"] }
    await adapter.set(updated)

    const retrieved = await adapter.get()
    expect(retrieved).toEqual(updated)
  })

  it("clears stored data", async () => {
    await adapter.set(sampleData)
    await adapter.clear()

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    const retrieved = await adapter.get()
    expect(retrieved).toBeNull()
  })

  it("returns null for corrupted JSON", async () => {
    localStorage.setItem(STORAGE_KEY, "{invalid json")
    const data = await adapter.get()
    expect(data).toBeNull()
  })
})
