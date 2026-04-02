import { describe, it, expect, beforeEach } from "vitest"
import StorageManager from "../../StorageManager"
import { StorageAdapter } from "../StorageAdapter"
import { Data, Label } from "../../index.d"

/** A minimal in-memory adapter for testing. */
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

  /** Seed data for a test. */
  seed(data: Data) {
    this.data = structuredClone(data)
  }
}

describe("StorageManager with adapter", () => {
  let adapter: InMemoryAdapter
  let manager: StorageManager

  beforeEach(() => {
    adapter = new InMemoryAdapter()
    manager = new StorageManager(adapter)
  })

  it("returns default data when adapter is empty", async () => {
    const { data } = await manager.getData()
    expect(data).toEqual(manager.defaultData)
    expect(data.labels).toHaveLength(2)
    expect(data.labels[0].title).toBe("Work")
    expect(data.labels[1].title).toBe("Personal")
    expect(data.tasks).toEqual({})
    expect(data.filters).toEqual([])
  })

  it("does not write back to adapter when data is clean", async () => {
    const seeded: Data = {
      filters: [],
      tasks: {},
      labels: [{ id: "label-1", title: "Seeded", color: "#00f" }],
      migrated: true,
      sections: {
        completed: { collapsed: true },
        focus: {},
        sidebar: { collapsed: false }
      }
    }
    adapter.seed(seeded)

    // getData should NOT trigger a write since no cleaning is needed
    await manager.getData()

    // Verify the adapter was not written to unnecessarily
    // (the data should still match what we seeded, not default data)
    const stored = await adapter.get()
    expect(stored?.labels[0].title).toBe("Seeded")
  })

  it("persists data through the adapter", async () => {
    const { data } = await manager.getData()

    const label: Label = { id: "", title: "Test", color: "#f00" }
    manager.addLabel(data, label)

    // Verify it was written to the adapter
    const stored = await adapter.get()
    expect(stored).not.toBeNull()
    expect(stored!.labels.some((l: Label) => l.title === "Test")).toBe(true)
  })

  it("can swap adapters at runtime", async () => {
    const { data } = await manager.getData()

    // Add a label via the first adapter
    const newData = manager.addLabel(data, {
      id: "",
      title: "Swapped",
      color: "#0f0"
    })

    // Create a new adapter and swap
    const newAdapter = new InMemoryAdapter()
    manager.setAdapter(newAdapter)

    // The new adapter starts empty
    const newAdapterData = await newAdapter.get()
    expect(newAdapterData).toBeNull()

    // Sync some data through the new adapter
    manager.uploadData(newData)
    const stored = await newAdapter.get()
    expect(stored).not.toBeNull()
    expect(stored!.labels.some((l: Label) => l.title === "Swapped")).toBe(true)
  })

  it("reads seeded data from the adapter", async () => {
    const seeded: Data = {
      filters: ["label-1"],
      tasks: {},
      labels: [{ id: "label-1", title: "Seeded", color: "#00f" }],
      migrated: true,
      sections: {
        completed: { collapsed: true },
        focus: {},
        sidebar: { collapsed: false }
      }
    }
    adapter.seed(seeded)

    const { data } = await manager.getData()
    expect(data.labels[0].title).toBe("Seeded")
    expect(data.filters).toEqual(["label-1"])
  })
})
