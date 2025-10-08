import StorageManager from "./StorageManager"
import { browser } from "webextension-polyfill-ts"

jest.mock("webextension-polyfill-ts", () => ({
  browser: {
    storage: {
      sync: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn(),
        clear: jest.fn()
      },
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn(),
        clear: jest.fn()
      }
    }
  }
}))

describe("StorageManager", () => {
  let inst = new StorageManager()

  beforeEach(() => {
    inst = new StorageManager()
    ;(browser.storage.sync.clear as jest.Mock).mockClear()
    ;(browser.storage.local.clear as jest.Mock).mockClear()
  })

  it("should NOT be busy by default", () => {
    expect(inst.busy).toBe(false)
  })

  it("should get data", async () => {
    const { data } = await inst.getData()

    expect(data).toEqual(inst.defaultData)
  })

  it("should migrate data if sync data available", async () => {
    const oldData = {
      filters: ["label-1"],
      labels: [{ id: "label-1", title: "Work", color: "black" }],
      tasks: {
        "03/02": [
          { id: "1", title: "Test", created_at: "03/02", completed: false }
        ],
        "02/02": [
          { id: "2", title: "Test 2", created_at: "02/02", completed: true }
        ]
      },
      notes: {}
    }

    browser.storage.sync.set(oldData)

    const { data: newData } = await inst.getData()

    expect(newData.migrated).toBe(true)
    expect(newData.sections).toBeDefined()
  })

  it("should correctly migrate corrupt data", async () => {
    const badData = {
      filters: null,
      tasks: [
        { id: "1", title: "Test", created_at: "03/02", completed: false },
        { id: "2", title: "Test 2", created_at: "02/02", completed: true }
      ],
      notes: []
    }

    browser.storage.sync.set(badData)

    const { data: newData } = await inst.getData()

    expect(newData).toEqual({
      filters: inst.defaultData.filters,
      labels: inst.defaultData.labels,
      tasks: inst.defaultData.tasks,
      notes: inst.defaultData.notes,
      sections: inst.defaultData.sections,
      migrated: true
    })
  })

  it("should remove any filters that do not exist", async () => {
    const data = {
      filters: ["does-not-exist"],
      labels: [{ id: "label-1", title: "Work", color: "black" }],
      tasks: {},
      notes: {},
      sections: inst.defaultData.sections,
      migrated: true
    }

    browser.storage.local.set(data)

    const { data: newData } = await inst.getData()

    expect(newData.filters).toEqual([])
    expect(newData.migrated).toBe(true)
    expect(newData.sections).toBeDefined()
  })

  describe("Task operations", () => {
    it("should add a task", () => {
      const task = {
        id: "1",
        title: "Test Task",
        created_at: new Date().toISOString(),
        completed: false
      }

      const newData = inst.addTask(inst.defaultData, task)

      const todayKey = new Date().toDateString()
      expect(newData.tasks[todayKey]).toBeDefined()
      expect(newData.tasks[todayKey][0].title).toBe("Test Task")
      expect(newData.tasks[todayKey][0].completed).toBe(false)
    })

    it("should update a task", () => {
      const task = {
        id: "1",
        title: "Original",
        created_at: new Date().toISOString(),
        completed: false
      }

      let data = inst.addTask(inst.defaultData, task)

      const todayKey = new Date().toDateString()
      const addedTask = data.tasks[todayKey][0]

      const updatedTask = { ...addedTask, title: "Updated" }
      data = inst.updateTask(data, updatedTask)

      expect(data.tasks[todayKey][0].title).toBe("Updated")
    })

    it("should set completed_at when marking task as complete", () => {
      const task = {
        id: "1",
        title: "Test",
        created_at: new Date().toISOString(),
        completed: false
      }

      let data = inst.addTask(inst.defaultData, task)

      const todayKey = new Date().toDateString()
      const addedTask = data.tasks[todayKey][0]

      const completedTask = { ...addedTask, completed: true }
      data = inst.updateTask(data, completedTask)

      expect(data.tasks[todayKey][0].completed).toBe(true)
      expect(data.tasks[todayKey][0].completed_at).toBeDefined()
    })

    it("should remove completed_at when unmarking task", () => {
      const task = {
        id: "1",
        title: "Test",
        created_at: new Date().toISOString(),
        completed: false
      }

      let data = inst.addTask(inst.defaultData, task)

      const todayKey = new Date().toDateString()
      let addedTask = data.tasks[todayKey][0]

      // First mark as complete to set completed_at
      const completedTask = { ...addedTask, completed: true }
      data = inst.updateTask(data, completedTask)

      expect(data.tasks[todayKey][0].completed_at).toBeDefined()

      // Then unmark to remove completed_at
      addedTask = data.tasks[todayKey][0]
      const uncompletedTask = { ...addedTask, completed: false }
      data = inst.updateTask(data, uncompletedTask)

      expect(data.tasks[todayKey][0].completed).toBe(false)
      expect(data.tasks[todayKey][0].completed_at).toBeUndefined()
    })

    it("should remove a task", () => {
      const task = {
        id: "1",
        title: "Test",
        created_at: new Date().toISOString(),
        completed: false
      }

      // Start with fresh data
      let data = {
        ...inst.defaultData,
        tasks: {} as any,
        notes: {}
      }

      data = inst.addTask(data, task)
      const todayKey = new Date().toDateString()

      expect(data.tasks[todayKey]).toHaveLength(1)

      const addedTask = data.tasks[todayKey][0]
      data = inst.removeTask(data, addedTask)

      expect(data.tasks[todayKey]).toHaveLength(0)
    })

    it("should move task to today", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const task = {
        id: "1",
        title: "Old Task",
        created_at: yesterday.toISOString(),
        completed: false
      }

      let data = inst.addTask(inst.defaultData, task)
      const oldKey = yesterday.toDateString()
      const todayKey = new Date().toDateString()

      // Manually set task to yesterday
      data.tasks = {
        [oldKey]: [task]
      } as any

      data = inst.moveTaskToToday(data, task)

      expect(data.tasks[oldKey]).toEqual([])
      expect(data.tasks[todayKey]).toBeDefined()
      expect(data.tasks[todayKey][0].title).toBe("Old Task")
    })
  })

  describe("Label operations", () => {
    it("should add a label", () => {
      const label = { id: "new-label", title: "New Label", color: "blue" }

      const newData = inst.addLabel(inst.defaultData, label)

      expect(newData.labels.length).toBe(3) // 2 default + 1 new
      expect(newData.labels[2].title).toBe("New Label")
    })

    it("should update a label", () => {
      const label = inst.defaultData.labels[0]
      const updatedLabel = { ...label, title: "Updated Label" }

      const newData = inst.updateLabel(inst.defaultData, updatedLabel)

      expect(newData.labels[0].title).toBe("Updated Label")
    })

    it("should remove a label", () => {
      const label = inst.defaultData.labels[0]

      const newData = inst.removeLabel(inst.defaultData, label)

      expect(newData.labels.length).toBe(1)
      expect(newData.labels.find(l => l.id === label.id)).toBeUndefined()
    })

    it("should get labels by id", () => {
      const labelsById = inst.getLabelsById(inst.defaultData)

      expect(Object.keys(labelsById).length).toBe(2)
      expect(labelsById[inst.defaultData.labels[0].id]).toBeDefined()
    })
  })

  describe("Note operations", () => {
    it("should update a note", () => {
      const date = "2024-01-15"
      const note = "This is a test note"

      const newData = inst.updateNote(inst.defaultData, note, date)

      expect(newData.notes[date]).toBe(note)
    })

    it("should not update if note is the same", () => {
      const date = "2024-01-15"
      const note = "Test note"

      let data = inst.updateNote(inst.defaultData, note, date)
      const originalData = data

      data = inst.updateNote(data, note, date)

      expect(data).toBe(originalData)
    })

    it("should not update if note is empty and previous was empty", () => {
      const date = "2024-01-15"

      const freshData = {
        ...inst.defaultData,
        tasks: {},
        notes: { [date]: "" } // Set empty string as previous state
      }

      const data = inst.updateNote(freshData, "", date)

      expect(data).toBe(freshData)
      expect(data.notes[date]).toBe("")
    })
  })

  describe("Filter operations", () => {
    it("should update filters", () => {
      const filters = [inst.defaultData.labels[0].id]

      const newData = inst.updateFilters(inst.defaultData, filters)

      expect(newData.filters).toEqual(filters)
    })

    it("should only set filters for existing labels", () => {
      const filters = ["non-existent-label", inst.defaultData.labels[0].id]

      const newData = inst.updateFilters(inst.defaultData, filters)

      expect(newData.filters).toEqual([inst.defaultData.labels[0].id])
    })
  })

  describe("Section operations", () => {
    it("should update section data", () => {
      const newData = inst.updateSection(inst.defaultData, "completed", {
        collapsed: false
      })

      expect(newData.sections?.completed.collapsed).toBe(false)
    })

    it("should create sections object if it does not exist", () => {
      const dataWithoutSections = { ...inst.defaultData, sections: undefined }

      const newData = inst.updateSection(dataWithoutSections, "notes", {
        collapsed: true
      })

      expect(newData.sections).toBeDefined()
      expect(newData.sections?.notes.collapsed).toBe(true)
    })
  })

  describe("Storage usage", () => {
    it("should calculate storage usage percentage", async () => {
      const usage = await inst.getStorageUsagePercent(inst.defaultData)

      expect(usage).toBeGreaterThanOrEqual(0)
      expect(usage).toBeLessThanOrEqual(1)
    })
  })
})
