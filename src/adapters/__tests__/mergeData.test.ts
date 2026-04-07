import { describe, it, expect } from "vitest"
import { mergeData } from "../mergeData"
import { Data } from "../../index.d"

const makeData = (overrides: Partial<Data> = {}): Data => ({
  schemaVersion: 1,
  filters: [],
  tasks: {},
  labels: [],
  sections: {
    completed: { collapsed: true },
    focus: {},
    sidebar: { collapsed: false }
  },
  ...overrides
})

const task = (id: string, title: string) => ({
  id,
  title,
  completed: false,
  created_at: new Date("2025-01-01").toISOString(),
  labels: []
})

const label = (id: string, title: string) => ({
  id,
  title,
  color: "#000"
})

describe("mergeData", () => {
  it("returns remote data when local is empty", () => {
    const local = makeData()
    const remote = makeData({
      tasks: { "Wed Jan 01 2025": [task("r1", "Remote task")] }
    })
    const result = mergeData(local, remote)
    expect(Object.values(result.tasks).flat()).toHaveLength(1)
    expect(Object.values(result.tasks).flat()[0].title).toBe("Remote task")
  })

  it("returns local data when remote is empty", () => {
    const local = makeData({
      tasks: { "Wed Jan 01 2025": [task("l1", "Local task")] }
    })
    const remote = makeData()
    const result = mergeData(local, remote)
    expect(Object.values(result.tasks).flat()).toHaveLength(1)
    expect(Object.values(result.tasks).flat()[0].title).toBe("Local task")
  })

  it("combines tasks from both sources", () => {
    const local = makeData({
      tasks: { "Wed Jan 01 2025": [task("l1", "Local task")] }
    })
    const remote = makeData({
      tasks: { "Wed Jan 01 2025": [task("r1", "Remote task")] }
    })
    const result = mergeData(local, remote)
    const all = Object.values(result.tasks).flat()
    expect(all).toHaveLength(2)
  })

  it("deduplicates tasks by id, local wins on conflict", () => {
    const sharedId = "shared"
    const local = makeData({
      tasks: {
        "Wed Jan 01 2025": [task(sharedId, "Local version")]
      }
    })
    const remote = makeData({
      tasks: {
        "Wed Jan 01 2025": [task(sharedId, "Remote version")]
      }
    })
    const result = mergeData(local, remote)
    const all = Object.values(result.tasks).flat()
    expect(all).toHaveLength(1)
    expect(all[0].title).toBe("Local version")
  })

  it("merges labels from both sources", () => {
    const local = makeData({ labels: [label("l1", "Work")] })
    const remote = makeData({ labels: [label("r1", "Personal")] })
    const result = mergeData(local, remote)
    expect(result.labels).toHaveLength(2)
  })

  it("deduplicates labels by id, local wins on conflict", () => {
    const sharedId = "shared"
    const local = makeData({ labels: [label(sharedId, "Local label")] })
    const remote = makeData({ labels: [label(sharedId, "Remote label")] })
    const result = mergeData(local, remote)
    expect(result.labels).toHaveLength(1)
    expect(result.labels[0].title).toBe("Local label")
  })

  it("prefers remote sections and filters", () => {
    const local = makeData({ filters: ["l1"] })
    const remote = makeData({
      filters: ["r1"],
      sections: {
        completed: { collapsed: false },
        focus: {},
        sidebar: { collapsed: true }
      }
    })
    const result = mergeData(local, remote)
    expect(result.filters).toEqual(["r1"])
    expect(result.sections?.completed?.collapsed).toBe(false)
  })
})
